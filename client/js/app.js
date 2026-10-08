document.addEventListener("DOMContentLoaded", () => {
  const authForm = document.getElementById("auth-form");
  if (new URLSearchParams(location.search).get("session") === "expired")
    showMessage("Your session expired. Please sign in again.");

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

      setToken(result.token);
      location.href = "index.html";
    } catch (error) {
      showMessage(error.message);
    }
  });

  const token = getToken();

  if (token && document.getElementById("account-actions")) {
    document.getElementById("account-actions").innerHTML = `
      <a
        class="quiet-button notification-link"
        id="notifications"
        href="notifications.html"
      >
        Notifications
        <span class="notification-indicator" aria-hidden="true" hidden></span>
      </a>
      ${
        document.getElementById("project-list")
          ? ""
          : '<a class="quiet-button" href="index.html">Projects</a>'
      }
      <button class="quiet-button" id="logout" type="button">
        Sign out
      </button>
    `;

    document.getElementById("logout").addEventListener("click", () => {
      clearToken();
      location.reload();
    });

    if (document.getElementById("project-list")) loadProjects();
    refreshUnreadNotificationCount().catch((error) => showToast(error.message));

    if (window.io) {
      socket = window.io("https://nexaops-server.vercel.app", {
        auth: { token },
        withCredentials: true,
      });

      socket.on("connect", () => {
        const connectionState = document.getElementById("connection-state");
        if (connectionState) connectionState.textContent = "Live";
        document.querySelector(".presence")?.classList.add("online");
      });

      socket.on("disconnect", () => {
        const connectionState = document.getElementById("connection-state");
        if (connectionState) connectionState.textContent = "Offline";
        document.querySelector(".presence")?.classList.remove("online");
      });

      socket.on("connect_error", (error) => {
        if (/invalid or expired token/i.test(error.message)) {
          clearToken();
          location.href = "login.html?session=expired";
        }
      });

      socket.on("notification:new", (notification) => {
        changeUnreadNotificationCount(1);
        showToast(notification.message);
        document.dispatchEvent(
          new CustomEvent("notification:new", { detail: notification }),
        );
      });

      if (document.getElementById("project-list")) {
        ["task:created", "task:updated", "task:deleted"].forEach((eventName) =>
          socket.on(eventName, refreshTasks),
        );

        socket.on("comment:created", (comment) => {
          if (activeTask === comment.task) openComments(activeTask);
        });
      }
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
  const inviteDialog = document.getElementById("invite-dialog");
  const inviteForm = document.getElementById("invite-form");

  document.getElementById("invite-member")?.addEventListener("click", () => {
    if (!activeProject) return;
    inviteForm.reset();
    inviteDialog.showModal();
    document.getElementById("invite-email").focus();
  });
  inviteDialog
    ?.querySelector("[data-close]")
    .addEventListener("click", () => inviteDialog.close());
  inviteForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeProject) return;

    const submitButton = document.getElementById("invite-submit");
    const email = String(new FormData(inviteForm).get("email") || "").trim();
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
      await request(`/projects/${activeProject}/members`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      inviteDialog.close();
      inviteForm.reset();
      await openProject(activeProject);
      showToast("Member added to the project");
    } catch (error) {
      showToast(error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send invite";
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
