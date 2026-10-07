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

See [`../client/README.md`](../client/README.md) for endpoint examples, authentication, and socket event details.

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
