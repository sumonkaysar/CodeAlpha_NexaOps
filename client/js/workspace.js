async function loadProjects() {
  const list = document.getElementById("project-list");
  if (!list || !localStorage.getItem(tokenKey)) return;

  try {
    const projects = await request("/projects");
    document.getElementById("project-count").textContent = projects.length;

    list.innerHTML = projects.length
      ? projects
          .map(
            (project) =>
              `
                <button class="project-row" data-project="${project._id}">
                  <h3>${escapeHtml(project.name)}</h3>
                  <p>${escapeHtml(project.description || "No description")}</p>
                </button>
              `,
          )
          .join("")
      : '<p class="empty-state">No projects yet. Create one to get started.</p>';

    list
      .querySelectorAll("[data-project]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          openProject(button.dataset.project),
        ),
      );
  } catch (error) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

async function openProject(id) {
  activeProject = id;
  const [project, tasks] = await Promise.all([
    request(`/projects/${id}`),
    request(`/tasks?project=${encodeURIComponent(id)}`),
  ]);

  document.getElementById("board").hidden = false;
  document.getElementById("board-title").textContent = project.name;
  document.getElementById("task-assignee").innerHTML =
    '<option value="">Unassigned</option>' +
    project.members
      .map(
        (member) =>
          `
            <option value="${member._id}">
              ${escapeHtml(member.name)}
            </option>
          `,
      )
      .join("");

  renderTasks(tasks);

  socket?.emit("project:join", id);

  document
    .getElementById("board")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderTasks(tasks) {
  const columns = document.getElementById("task-columns");

  const statusOptions = (task) => `
    <select aria-label="Task status" data-status="${task._id}">
      <option value="todo" ${task.status === "todo" ? "selected" : ""}>
        To do
      </option>
      <option
        value="in-progress"
        ${task.status === "in-progress" ? "selected" : ""}
      >
        In progress
      </option>
      <option value="done" ${task.status === "done" ? "selected" : ""}>
        Done
      </option>
    </select>
  `;

  columns.innerHTML = ["todo", "in-progress", "done"]
    .map(
      (status) => `
        <section class="task-column">
          <h3>${status.replace("-", " ")}</h3>
          ${tasks
            .filter((task) => task.status === status)
            .map(
              (task) => `
                <article class="task-card" data-task="${task._id}">
                  <h4>${escapeHtml(task.title)}</h4>
                  <p>
                    ${escapeHtml(task.description || "No description")} ·
                    ${escapeHtml(task.priority)} priority
                  </p>
                  ${statusOptions(task)}
                </article>
              `,
            )
            .join("")}
        </section>
      `,
    )
    .join("");

  columns.querySelectorAll("[data-status]").forEach((select) =>
    select.addEventListener("change", async () => {
      await request(`/tasks/${select.dataset.status}`, {
        method: "PATCH",
        body: JSON.stringify({ status: select.value }),
      });
    }),
  );

  columns.querySelectorAll("[data-task]").forEach((card) =>
    card.addEventListener("click", (event) => {
      if (!event.target.matches("select")) openComments(card.dataset.task);
    }),
  );
}

async function refreshTasks() {
  if (activeProject)
    renderTasks(
      await request(`/tasks?project=${encodeURIComponent(activeProject)}`),
    );
}

async function openComments(taskId) {
  activeTask = taskId;
  const panel = document.getElementById("comments-panel");
  panel.hidden = false;
  const comments = await request(`/tasks/${taskId}/comments`);

  document.getElementById("comment-list").innerHTML =
    comments
      .map(
        (comment) =>
          `
            <div class="comment-item">
              <strong>${escapeHtml(comment.author.name)}</strong>
              ${escapeHtml(comment.body)}
            </div>
          `,
      )
      .join("") || '<p class="empty-state">No comments yet.</p>';
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
