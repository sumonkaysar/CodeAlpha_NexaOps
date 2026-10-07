# NexaOps Server

NexaOps Server is an Express API and Socket.IO service for collaborative project management. It stores accounts, projects, tasks, comments, and notifications in MongoDB.

## Links

- **Live API and Socket.IO:** [https://nexaops-server.vercel.app](https://nexaops-server.vercel.app)
- **Client:** Client deployment URL is not configured; see [`../client/README.md`](../client/README.md) to run it locally.
- **GitHub:** [sumonkaysar/CodeAlpha_NexaOps](https://github.com/sumonkaysar/CodeAlpha_NexaOps)

## Features and stack

- Express REST API with modular auth, projects, tasks, comments, notifications, and upload features.
- JWT authentication for HTTP and Socket.IO; sockets join authenticated user/project rooms.
- MongoDB/Mongoose persistence and Cloudinary image uploads.
- Node.js, Express, Socket.IO, MongoDB/Mongoose, `jsonwebtoken`, `bcryptjs`, Multer, Cloudinary.

## Get the project

```sh
git clone https://github.com/sumonkaysar/CodeAlpha_NexaOps.git
cd CodeAlpha_NexaOps/server
```

## Install dependencies

Choose one package manager from this directory:

```sh
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

## Configure and run on port 5000

Create a `server/.env` file (there is no committed `.env.example` in this project). Set `PORT=5000`, a MongoDB connection string, a long private JWT secret, and Cloudinary credentials for image uploads. For local frontend testing, set `CLIENT_ORIGIN=http://localhost:5500`.

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/nexaops
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGIN=http://localhost:5500
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=nexaops
```

Start MongoDB and then use one command:

```sh
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun run dev
```

The server's default port is 5100, but `PORT=5000` makes it available at `http://localhost:5000` for REST and Socket.IO. Production start: `npm start`, `yarn start`, `pnpm start`, or `bun run start`.

## API and Socket.IO

Base URL: `http://localhost:5000/api` locally or `https://nexaops-server.vercel.app/api` hosted. All routes except registration/login require `Authorization: Bearer <token>`. JSON requests use `Content-Type: application/json`; uploads use multipart form-data. Errors return a JSON message/error.

| Method | Path | Request body / response |
|---|---|---|
| `GET` | `/` | Public health response `{ "name": "NexaOps API", "status": "ready" }` (outside `/api`). |
| `POST` | `/auth/register` | `{ "name": "Sam", "email": "sam@example.com", "password": "at-least-8-characters" }`; success `201` with `{ "id": "...", "name": "Sam", "email": "sam@example.com" }`. |
| `POST` | `/auth/login` | `{ "email": "sam@example.com", "password": "..." }`; response `{ "token": "...", "user": { "id": "...", "name": "...", "email": "..." } }`. |
| `GET` | `/projects` | Returns projects owned by or shared with the signed-in user. |
| `POST` | `/projects` | `{ "name": "Website refresh", "description": "..." }`; `name` required; returns the created project (`201`). |
| `GET` | `/projects/:id` | Returns an accessible project with member details. |
| `PATCH` | `/projects/:id` | Owner-only; any of `{ "name": "...", "description": "...", "members": ["<user-id>"] }`; returns the updated project. `members` is an array of user IDs. |
| `DELETE` | `/projects/:id` | Owner-only; `204 No Content`. |
| `POST` | `/projects/:id/members` | Owner-only `{ "email": "member@example.com" }`; adds an existing user and returns the project with populated members. |
| `GET` | `/tasks?project=:projectId` | Lists tasks for a project the user can access. |
| `POST` | `/tasks` | `{ "project": "<project-id>", "title": "Plan release", "description": "...", "priority": "medium", "assignee": null, "dueDate": null }`; `project` and `title` are required; returns the task (`201`). |
| `PATCH` | `/tasks/:id` | Any of `title`, `description`, `status`, `priority`, `assignee`, `dueDate`; returns the updated task. Status values are `todo`, `in-progress`, or `done`; priority values are `low`, `medium`, or `high`. |
| `DELETE` | `/tasks/:id` | Deletes an accessible task; `204 No Content`. |
| `GET` | `/tasks/:taskId/comments` | Lists comments on an accessible task. |
| `POST` | `/tasks/:taskId/comments` | `{ "body": "Looks good" }`; body must not be empty; returns the populated comment (`201`). |
| `DELETE` | `/tasks/:taskId/comments/:commentId` | Author-only; `204 No Content`. |
| `GET` | `/notifications` | Returns up to 50 most recent notifications for the current user. |
| `GET` | `/notifications/unread-count` | Returns `{ "count": 0 }`. |
| `PATCH` | `/notifications/:id/read` | No body; marks a notification read and returns it. |
| `POST` | `/uploads/image` | Multipart form field `image`; authenticated JPG/PNG/WEBP/GIF upload up to 5 MB; returns `{ "message": "Image uploaded successfully", "url": "https://...", "publicId": "..." }` (`201`). |

### Socket.IO

Connect to the server origin (not `/api`) and authenticate in the handshake:

```js
const socket = io("http://localhost:5000", {
  auth: { token: "<JWT>" },
});
```

| Event | Direction | Payload / behavior |
|---|---|---|
| `project:join` | Client → server | Send a project ID and optional acknowledgement callback. Membership is checked; success callback is `{ "projectId": "..." }`, failure callback is `{ "error": "..." }`. The socket joins `project:<id>`. |
| `task:created` | Server → project room | The created task document. |
| `task:updated` | Server → project room | The updated task document. |
| `task:deleted` | Server → project room | `{ "taskId": "..." }`. |
| `comment:created` | Server → project room | The created comment with populated author. |
| `project:updated` | Server → project room | Updated project document. |
| `project:deleted` | Server → project room | `{ "projectId": "..." }`. |
| `notification:new` | Server → user room | Newly created notification document. |

The client may also observe standard Socket.IO `connect`, `disconnect`, and `connect_error` events. JWTs are verified at connection time; disconnect and reconnect when the token changes or expires.

See [`../client/README.md`](../client/README.md) for the browser-side configuration and local serving instructions.

## Server structure

```text
src/
  server.js                 HTTP server, Socket.IO auth, and project rooms
  app.js                    Express setup and route mounts
  app/
    config/                 MongoDB and Cloudinary configuration
    middlewares/            JWT auth, uploads, and error handling
    modules/
      auth/                 Registration and login
      project/              Project CRUD and membership
      task/                 Task CRUD
      comment/              Task comments
      notification/         User notification feed
      upload/               Image upload endpoint
```

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | HTTP and Socket.IO port; set to `5000` for local development (fallback is `5100`). |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | Private key for bearer and socket tokens. |
| `CLIENT_ORIGIN` | Allowed browser origin for CORS; set to the exact local client origin. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials for image upload. |
| `CLOUDINARY_FOLDER` | Image folder in Cloudinary. |

## Operational notes

MongoDB must be reachable before the HTTP server starts. The API uses JSON request bodies (up to 1 MB) and image uploads are limited to 5 MB. Keep `.env` values private; the repository currently does not include a committed NexaOps `.env.example`.
