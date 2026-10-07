# NexaOps Client

The NexaOps frontend is a static HTML/CSS/JavaScript dashboard. It calls the NexaOps REST API and uses Socket.IO for live project activity and notifications.

## Features and files

- `index.html`, `login.html`, `register.html`, and `notifications.html`
- `js/app.js`: application startup, Socket.IO connection, live updates
- `js/workspace.js`: project/task workspace interactions
- `js/common.js`: shared API and browser state helpers
- `css/`: main and responsive styles

## Run locally

1. Start the backend as described in [`../server/README.md`](../server/README.md).
2. The current API URL and Socket.IO host are `https://nexaops-server.vercel.app`. Change the `API` constant in `js/common.js` to `http://localhost:5000/api` and the `window.io(...)` server URL in `js/app.js` to `http://localhost:5000`.
3. Serve this directory, for example with `python -m http.server 5500`, and open `http://localhost:5500`. Register/sign in before accessing protected views.

## Links

- **Live client:** No client deployment URL is configured in the repository.
- **Live API:** [https://nexaops-server.vercel.app](https://nexaops-server.vercel.app)
- **GitHub:** [sumonkaysar/CodeAlpha_NexaOps](https://github.com/sumonkaysar/CodeAlpha_NexaOps)

## REST API

Base URL is `http://localhost:5000/api` locally, or `https://nexaops-server.vercel.app/api` for the hosted server. Except for registration and login, the routes below require `Authorization: Bearer <token>`. JSON responses are returned for successful reads and writes; deletion responds with `204 No Content`. Invalid requests use a JSON `message` or `error`.

| Method | Path | Request / response |
|---|---|---|
| `POST` | `/auth/register` | `{ "name": "Sam", "email": "sam@example.com", "password": "..." }`; creates an account and returns the public user object. |
| `POST` | `/auth/login` | `{ "email": "sam@example.com", "password": "..." }`; returns `{ "token": "...", "user": { "id": "...", "name": "...", "email": "..." } }`. |
| `GET` | `/projects` | Lists projects the current user owns or belongs to. |
| `POST` | `/projects` | `{ "name": "Website refresh", "description": "..." }`; creates a project and returns it (`201`). |
| `GET` | `/projects/:id` | Gets an accessible project. |
| `PATCH` | `/projects/:id` | Updates project fields; returns the updated project. |
| `DELETE` | `/projects/:id` | Deletes an accessible project; `204`. |
| `POST` | `/projects/:id/members` | `{ "email": "member@example.com" }`; owner-only, adds an existing account and returns the populated project. |
| `GET` | `/tasks?project=:id` | Lists tasks for an accessible project. |
| `POST` | `/tasks` | `{ "project": "<project-id>", "title": "Plan release", "description": "...", "priority": "medium", "assignee": null, "dueDate": null }`; creates and returns the task (`201`). |
| `PATCH` | `/tasks/:id` | Updates any provided `title`, `description`, `status`, `priority`, `assignee`, or `dueDate`; returns the updated task. |
| `DELETE` | `/tasks/:id` | Deletes a task; `204`. |
| `GET` | `/tasks/:taskId/comments` | Lists comments for a task. |
| `POST` | `/tasks/:taskId/comments` | `{ "body": "Looks good" }`; creates a comment and returns it. |
| `DELETE` | `/tasks/:taskId/comments/:commentId` | Deletes the current user's comment; `204`. |
| `GET` | `/notifications` | Returns the current user's latest notifications (up to 50). |
| `GET` | `/notifications/unread-count` | Returns `{ "count": 0 }`. |
| `PATCH` | `/notifications/:id/read` | Marks a notification as read; returns the updated notification. |
| `POST` | `/uploads/image` | Authenticated multipart image upload; returns `{ "message": "Image uploaded successfully", "url": "...", "publicId": "..." }`. |

Project/task bodies are validated by the corresponding feature handlers. Check those route/controller modules for required fields if extending the client.

## Socket.IO

Connect to the server origin (not `/api`) with the token in the handshake:

```js
const socket = io("http://localhost:5000", {
  auth: { token: "<JWT>" },
});
```

| Event | Direction | Payload / behavior |
|---|---|---|
| `project:join` | Client → server | Send the project ID and optional acknowledgement callback. The server checks membership, switches the socket into `project:<id>`, and acknowledges `{ "projectId": "..." }` or `{ "error": "..." }`. |
| `task:created`, `task:updated`, `task:deleted` | Server → project room | Task changes are broadcast to members in the project's room; deleted payload contains `taskId`. |
| `comment:created` | Server → project room | Broadcasts the created comment. |
| `project:updated`, `project:deleted` | Server → project room | Broadcasts project changes to project members. |
| `notification:new` | Server → user room | Delivers a new notification to the recipient's authenticated user room. |

Socket connections require the same valid JWT as the REST API. The server validates project membership before allowing a socket to join a project room.
