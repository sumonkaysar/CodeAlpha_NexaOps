# CodeAlpha NexaOps

NexaOps is a collaborative project and task management app. Members can manage projects and tasks, discuss tasks with comments, receive notifications, and see project updates in real time.

## Links

- **Client:** No client deployment URL is configured in the repository. See [`client/README.md`](client/README.md) to run it locally.
- **Server/API:** [https://nexaops-server.vercel.app](https://nexaops-server.vercel.app)
- **GitHub:** [sumonkaysar/CodeAlpha_NexaOps](https://github.com/sumonkaysar/CodeAlpha_NexaOps)

## Features

- JWT-based accounts and access-controlled collaborative projects.
- Project membership and task/comment management.
- Notifications with unread counts and authenticated Socket.IO updates.
- Static client, modular Express/MongoDB API, and Cloudinary image uploads.

## Technology and layout

- **Client:** HTML, CSS, vanilla JavaScript, Socket.IO client
- **Server:** Node.js, Express, MongoDB/Mongoose, JWT, Socket.IO
- **Uploads:** Multer and Cloudinary

```text
client/                  Dashboard, auth, notifications, and browser scripts
server/
  src/server.js          HTTP and Socket.IO server
  src/app.js             Express setup and route registration
  src/app/modules/       Auth, projects, tasks, comments, notifications, uploads
```

See [`server/README.md`](server/README.md) for installation and [`client/README.md`](client/README.md) for REST and socket contracts.

## Local development

Run MongoDB, start the API with `PORT=5000`, and serve the static client on `http://localhost:5500`. Configure the allowed client origin on the server and update the client's API and Socket.IO origins to match the local API.

## Realtime behavior

The Socket.IO server authenticates connections with the same JWT used by HTTP requests. Project membership is verified before sockets join project rooms. Project/task changes, comments, and notifications are broadcast to their appropriate project or user room.

## Environment and data

MongoDB stores accounts, projects, tasks, comments, and notifications. Cloudinary is used for uploaded images. Keep the JWT secret and Cloudinary credentials private and use a dedicated database for local development.

## Limitations

The repository does not configure a separate live client URL. A production deployment needs a compatible long-running Node/Socket.IO host; verify the hosting platform supports WebSockets before relying on realtime updates.
