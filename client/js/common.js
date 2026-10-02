const API = "https://nexaops-server.vercel.app/api";
const tokenKey = "nexaops_token";
let activeProject = null;
let activeTask = null;
let socket = null;
let toastTimeout;
let unreadNotificationCount = null;
let unreadNotificationRevision = 0;

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(localStorage.getItem(tokenKey)
        ? { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` }
        : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Request failed");
  }

  return response.status === 204 ? null : response.json();
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  return request("/uploads/image", {
    method: "POST",
    body: formData,
  });
}

function renderNotificationIndicator() {
  const link = document.getElementById("notifications");
  if (!link || unreadNotificationCount === null) return;

  let indicator = link.querySelector(".notification-indicator");
  if (!indicator) {
    indicator = document.createElement("span");
    indicator.className = "notification-indicator";
    indicator.setAttribute("aria-hidden", "true");
    link.append(indicator);
  }

  const hasUnread = unreadNotificationCount > 0;
  link.classList.toggle("has-unread", hasUnread);
  link.setAttribute(
    "aria-label",
    hasUnread
      ? `Notifications, ${unreadNotificationCount} unread`
      : "Notifications",
  );
  link.title = hasUnread
    ? `${unreadNotificationCount} unread notification${unreadNotificationCount === 1 ? "" : "s"}`
    : "Notifications";
  indicator.hidden = !hasUnread;
}

async function refreshUnreadNotificationCount() {
  const revision = unreadNotificationRevision;
  const result = await request("/notifications/unread-count");
  if (revision !== unreadNotificationRevision) return;

  unreadNotificationCount = Number(result.count) || 0;
  renderNotificationIndicator();
}

function changeUnreadNotificationCount(change) {
  unreadNotificationRevision += 1;

  if (unreadNotificationCount === null) {
    refreshUnreadNotificationCount().catch((error) => showToast(error.message));
    return;
  }

  unreadNotificationCount = Math.max(0, unreadNotificationCount + change);
  renderNotificationIndicator();
}

function showMessage(message) {
  const target = document.getElementById("form-message");
  if (target) target.textContent = message;
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }

  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimeout);

  toastTimeout = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "app-confirm-dialog";

    const content = document.createElement("div");
    content.className = "app-confirm-content";

    const title = document.createElement("h2");
    title.id = "app-confirm-title";
    title.textContent = "Confirm action";
    dialog.setAttribute("aria-labelledby", title.id);

    const description = document.createElement("p");
    description.textContent = message;

    const actions = document.createElement("div");
    actions.className = "app-confirm-actions";

    const cancel = document.createElement("button");
    cancel.className = "quiet-button";
    cancel.type = "button";
    cancel.textContent = "Cancel";

    const confirm = document.createElement("button");
    confirm.className = "button";
    confirm.type = "button";
    confirm.textContent = "Confirm";

    cancel.addEventListener("click", () => dialog.close("cancel"));
    confirm.addEventListener("click", () => dialog.close("confirm"));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close("cancel");
    });

    dialog.addEventListener(
      "close",
      () => {
        resolve(dialog.returnValue === "confirm");
        dialog.remove();
      },
      { once: true },
    );

    actions.append(cancel, confirm);
    content.append(title, description, actions);
    dialog.append(content);
    document.body.append(dialog);
    dialog.showModal();
  });
}
