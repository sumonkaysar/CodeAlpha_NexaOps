const escapeNotificationHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

function renderNotification(notification) {
  const unread = !notification.readAt;
  return `
    <article
      class="notification-item${unread ? " is-unread" : ""}"
      data-notification-id="${escapeNotificationHTML(notification._id)}"
    >
      <span class="notification-marker" aria-hidden="true"></span>
      <div class="notification-copy">
        <p>${escapeNotificationHTML(notification.message)}</p>
        <time datetime="${escapeNotificationHTML(notification.createdAt)}">
          ${new Date(notification.createdAt).toLocaleString()}
        </time>
      </div>
      ${
        unread
          ? `
            <button
              class="notification-read"
              type="button"
              data-mark-read="${escapeNotificationHTML(notification._id)}"
            >
              Mark as read
            </button>
          `
          : '<span class="notification-read-label">Read</span>'
      }
    </article>
  `;
}

function prependNotification(notification) {
  const list = document.getElementById("notifications-list");
  if (!list || list.querySelector(`[data-notification-id="${CSS.escape(notification._id)}"]`))
    return;

  const emptyState = list.querySelector(".empty-state");
  if (emptyState) emptyState.remove();

  list.insertAdjacentHTML("afterbegin", renderNotification(notification));
  list.setAttribute("aria-busy", "false");
}

async function loadNotificationsPage() {
  const list = document.getElementById("notifications-list");
  if (!list) return;

  if (!getToken()) {
    list.innerHTML = `
      <p class="empty-state">
        Sign in to view your notifications.
        <a href="login.html">Go to sign in</a>
      </p>
    `;
    list.setAttribute("aria-busy", "false");
    return;
  }

  try {
    const notifications = await request("/notifications");
    list.innerHTML = notifications.length
      ? notifications.map(renderNotification).join("")
      : '<p class="empty-state">You are all caught up.</p>';
    list.setAttribute("aria-busy", "false");
  } catch (error) {
    list.innerHTML = `
      <p class="empty-state">
        Notifications could not be loaded: ${escapeNotificationHTML(error.message)}
      </p>
    `;
    list.setAttribute("aria-busy", "false");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNotificationsPage();

  document.addEventListener("notification:new", (event) => {
    prependNotification(event.detail);
  });

  document
    .getElementById("notifications-list")
    ?.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-mark-read]");
      if (!button) return;

      button.disabled = true;
      try {
        const notification = await request(
          `/notifications/${encodeURIComponent(button.dataset.markRead)}/read`,
          { method: "PATCH" },
        );
        const item = button.closest(".notification-item");
        if (item.classList.contains("is-unread"))
          changeUnreadNotificationCount(-1);
        item.classList.remove("is-unread");
        item.querySelector(".notification-copy time").dateTime =
          notification.createdAt;
        button.replaceWith(
          Object.assign(document.createElement("span"), {
            className: "notification-read-label",
            textContent: "Read",
          }),
        );
      } catch (error) {
        button.disabled = false;
        showToast(error.message);
      }
    });
});
