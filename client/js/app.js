document.addEventListener("DOMContentLoaded", () => {
  const authForm = document.getElementById("auth-form");

  authForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(authForm));

    try {
      if (authForm.dataset.mode === "register")
        await request("/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });

      const result = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      localStorage.setItem(tokenKey, result.token);
      location.href = "index.html";
    } catch (error) {
      showMessage(error.message);
    }
  });

  const token = localStorage.getItem(tokenKey);

  if (token && document.getElementById("project-list")) {
    document.getElementById("account-actions").innerHTML = `
      <button class="quiet-button" id="notifications" type="button">
        Notifications
      </button>
      <button class="quiet-button" id="logout" type="button">
        Sign out
      </button>
    `;

    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem(tokenKey);
      location.reload();
    });

    loadProjects();
    loadNotifications();

    document.getElementById("notifications").addEventListener("click", () => {
      const panel = document.getElementById("notification-panel");
      panel.hidden = !panel.hidden;
    });

    if (window.io) {
      socket = window.io("https://nexaops-server.vercel.app", {
        auth: { token },
      });

      socket.on("connect", () => {
        document.getElementById("connection-state").textContent = "Live";
        document.querySelector(".presence")?.classList.add("online");
      });

      socket.on("disconnect", () => {
        document.getElementById("connection-state").textContent = "Offline";
        document.querySelector(".presence")?.classList.remove("online");
      });

      ["task:created", "task:updated", "task:deleted"].forEach((eventName) =>
        socket.on(eventName, refreshTasks),
      );

      socket.on("comment:created", (comment) => {
        if (activeTask === comment.task) openComments(activeTask);
      });

      socket.on("notification:new", (notification) => {
        const panel = document.getElementById("notification-panel");
        panel.hidden = false;
        loadNotifications().catch(() => {
          panel.textContent = notification.message;
        });
      });
    }
  }

  const projectDialog = document.getElementById("project-dialog");

  document
    .getElementById("new-project")
    ?.addEventListener("click", () => projectDialog.showModal());
  projectDialog
    ?.querySelector("[data-close]")
    .addEventListener("click", () => projectDialog.close());
  document
    .getElementById("project-form")
    ?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      await request("/projects", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      form.reset();
      projectDialog.close();
      loadProjects();
    });

  const taskDialog = document.getElementById("task-dialog");
  document
    .getElementById("invite-member")
    ?.addEventListener("click", async () => {
      const email = prompt("Email address of an existing NexaOps user");
      if (!email?.trim() || !activeProject) return;
      try {
        await request(`/projects/${activeProject}/members`, {
          method: "POST",
          body: JSON.stringify({ email: email.trim() }),
        });
        await openProject(activeProject);
      } catch (error) {
        showToast(error.message);
      }
    });
  document
    .getElementById("new-task")
    ?.addEventListener("click", () => activeProject && taskDialog.showModal());
  taskDialog
    ?.querySelector("[data-close]")
    .addEventListener("click", () => taskDialog.close());
  document
    .getElementById("task-form")
    ?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;

      const values = Object.fromEntries(new FormData(form));
      if (!values.assignee) values.assignee = null;
      await request("/tasks", {
        method: "POST",
        body: JSON.stringify({ ...values, project: activeProject }),
      });
      form.reset();
      taskDialog.close();
      refreshTasks();
    });

  document
    .getElementById("comment-form")
    ?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("comment-input");
      await request(`/tasks/${activeTask}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: input.value }),
      });
      input.value = "";
      openComments(activeTask);
    });
});
