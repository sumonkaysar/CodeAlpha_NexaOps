const mongoose = require("mongoose");
const Task = require("./task.model");
const Project = require("../project/project.model");
const { fail, getAccessibleProject } = require("../project/project.service");

exports.list = async (req, res) => {
  const projectId = req.query.project;
  await getAccessibleProject(projectId, req.user.id);
  res.json(
    await Task.find({ project: projectId })
      .populate("assignee", "name email")
      .populate("createdBy", "name")
      .sort({ updatedAt: -1 }),
  );
};

exports.create = async (req, res) => {
  const {
    project: projectId,
    title,
    description = "",
    priority = "medium",
    assignee = null,
    dueDate = null,
  } = req.body;
  const project = await getAccessibleProject(projectId, req.user.id);
  if (typeof title !== "string" || !title.trim())
    throw fail("Task title is required");
  if (
    !project.members.some((member) => String(member) === String(assignee)) &&
    assignee
  )
    throw fail("Assignee must be a project member");
  const task = await Task.create({
    project: projectId,
    title: title.trim(),
    description,
    priority,
    assignee,
    dueDate,
    createdBy: req.user.id,
  });
  const result = await task.populate("assignee", "name email");
  req.app.get("io").to(`project:${projectId}`).emit("task:created", result);
  if (assignee && String(assignee) !== req.user.id) {
    const Notification = require("../notification/notification.model");
    const notification = await Notification.create({
      recipient: assignee,
      project: projectId,
      task: task.id,
      message: `You were assigned to ${task.title}`,
    });
    req.app
      .get("io")
      .to(`user:${assignee}`)
      .emit("notification:new", notification);
  }
  res.status(201).json(result);
};

exports.update = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw fail("Invalid task id");
  const task = await Task.findById(req.params.id);
  if (!task) throw fail("Task not found", 404);
  const project = await getAccessibleProject(task.project, req.user.id);
  const updates = {};
  for (const field of [
    "title",
    "description",
    "status",
    "priority",
    "assignee",
    "dueDate",
  ]) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (
    updates.title !== undefined &&
    (typeof updates.title !== "string" || !updates.title.trim())
  )
    throw fail("Task title cannot be empty");
  if (
    updates.assignee &&
    !project.members.some(
      (member) => String(member) === String(updates.assignee),
    )
  )
    throw fail("Assignee must be a project member");
  Object.assign(task, updates);
  await task.save();
  const result = await task.populate("assignee", "name email");
  req.app.get("io").to(`project:${project.id}`).emit("task:updated", result);
  res.json(result);
};

exports.remove = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw fail("Invalid task id");
  const task = await Task.findById(req.params.id);
  if (!task) throw fail("Task not found", 404);
  const project = await getAccessibleProject(task.project, req.user.id);
  await task.deleteOne();
  req.app
    .get("io")
    .to(`project:${project.id}`)
    .emit("task:deleted", { taskId: task.id });
  res.status(204).end();
};
