require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./app/config/db");
const Project = require("./app/modules/project/project.model");

const PORT = process.env.PORT || 5100;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || true },
});

app.set("io", io);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (_error) {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  if (socket.user && socket.user.id) socket.join(`user:${socket.user.id}`);
  socket.on("project:join", async (projectId, callback = () => {}) => {
    try {
      if (typeof projectId !== "string")
        return callback({ error: "Invalid project id" });
      const project = await Project.exists({
        _id: projectId,
        $or: [{ owner: socket.user.id }, { members: socket.user.id }],
      });

      if (!project) return callback({ error: "Project not found" });

      for (const room of socket.rooms)
        if (room.startsWith("project:")) await socket.leave(room);

      socket.join(`project:${projectId}`);

      callback({ projectId });
    } catch (_error) {
      callback({ error: "Could not join project" });
    }
  });
});

connectDB()
  .then(() =>
    server.listen(PORT, () => console.log(`NexaOps listening on ${PORT}`)),
  )
  .catch((error) => {
    console.error("NexaOps database connection failed:", error.message);
    process.exit(1);
  });
