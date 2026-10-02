const express = require("express");
const cors = require("cors");
const AuthRouter = require("./app/modules/auth/auth.route");
const ProjectRouter = require("./app/modules/project/project.route");
const TaskRouter = require("./app/modules/task/task.route");
const CommentRouter = require("./app/modules/comment/comment.route");
const NotificationRouter = require("./app/modules/notification/notification.route");
const UploadRouter = require("./app/modules/upload/upload.route");
const notFoundMiddleware = require("./app/middlewares/notFoundMiddleware");
const errorHandlerMiddleware = require("./app/middlewares/errorHandlerMiddleware");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", AuthRouter);
app.use("/api/projects", ProjectRouter);
app.use("/api/tasks", TaskRouter);
app.use("/api/tasks", CommentRouter);
app.use("/api/notifications", NotificationRouter);
app.use("/api/uploads", UploadRouter);
app.get("/", (_req, res) => res.json({ name: "NexaOps API", status: "ready" }));
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

module.exports = app;
