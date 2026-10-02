# CodeAlpha NexaOps

A collaborative project and task management app. The client is static HTML/CSS/JavaScript; the server is a modular Express and MongoDB API with Socket.IO updates.

## Run

1. Copy `server/.env.example` to `server/.env` and set `MONGO_URI`, `JWT_SECRET`, and the Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) for authenticated image uploads.
2. From `server`, run `pnpm install` and `pnpm dev`.
3. Serve `client` at `http://localhost:5500` (for example, with VS Code Live Server). The API defaults to `http://localhost:5100/api`.

Register and log in through the API before using protected project and task routes. Socket.IO authenticates using the same bearer token.

## API

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET|POST /api/projects`, `GET|PATCH|DELETE /api/projects/:id`, `POST /api/projects/:id/members`
- `GET|POST /api/tasks`, `PATCH|DELETE /api/tasks/:id`
- `GET|POST /api/tasks/:taskId/comments`
- `GET /api/notifications`
- `POST /api/uploads/image` (authenticated Cloudinary image upload)

Project/task changes and comments are emitted to the relevant `project:<id>` Socket.IO room.
