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

  const io = req.app.get("io");
  io.to(`project:${projectId}`).emit("task:created", result);

  const NotificationService = require("../notification/notification.service");
  const otherMembers = project.members
    .map(String)
    .filter((memberId) => memberId !== String(assignee));
  await NotificationService.createForUsers({
    recipientIds: otherMembers,
    actorId: req.user.id,
    projectId,
    taskId: task.id,
    message: `${req.user.name} created task "${task.title}" in ${project.name}`,
    io,
  });
  if (assignee) {
    await NotificationService.createForUsers({
      recipientIds: [assignee],
      actorId: req.user.id,
      projectId,
      taskId: task.id,
      message: `You were assigned to "${task.title}" in ${project.name}`,
      actorMessage: `You assigned ${result.assignee?.name || "a team member"} to "${task.title}" in ${project.name}`,
      io,
    });
  }

  res.status(201).json(result);
};

exports.update = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw fail("Invalid task id");

  const task = await Task.findById(req.params.id);
  if (!task) throw fail("Task not found", 404);

  const project = await getAccessibleProject(task.project, req.user.id);
  const previousAssignee = task.assignee ? String(task.assignee) : null;
  const previousStatus = task.status;

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

  const io = req.app.get("io");
  const newAssignee = task.assignee ? String(task.assignee) : null;
  const result = await task.populate("assignee", "name email");
  io.to(`project:${project.id}`).emit("task:updated", result);

  const NotificationService = require("../notification/notification.service");
  if (newAssignee && newAssignee !== previousAssignee) {
    await NotificationService.createForUsers({
      recipientIds: [newAssignee],
      actorId: req.user.id,
      projectId: project.id,
      taskId: task.id,
      message: `You were assigned to "${task.title}" in ${project.name}`,
      actorMessage: `You assigned ${result.assignee?.name || "a team member"} to "${task.title}" in ${project.name}`,
      io,
    });
  }
  if (
    previousAssignee &&
    previousAssignee !== newAssignee &&
    previousAssignee !== req.user.id
  ) {
    await NotificationService.createForUsers({
      recipientIds: [previousAssignee],
      actorId: req.user.id,
      projectId: project.id,
      taskId: task.id,
      message: `You are no longer assigned to "${task.title}" in ${project.name}`,
      io,
    });
  }

  if (updates.status !== undefined && updates.status !== previousStatus) {
    await NotificationService.createForUsers({
      recipientIds: project.members,
      actorId: req.user.id,
      projectId: project.id,
      taskId: task.id,
      message: `${req.user.name} moved "${task.title}" to ${task.status.replace("-", " ")}`,
      io,
    });
  }

  const detailsChanged = ["title", "description", "priority", "dueDate"].some(
    (field) => updates[field] !== undefined,
  );
  if (detailsChanged) {
    await NotificationService.createForUsers({
      recipientIds: project.members,
      actorId: req.user.id,
      projectId: project.id,
      taskId: task.id,
      message: `${req.user.name} updated task "${task.title}" in ${project.name}`,
      io,
    });
  }

  res.json(result);
};

exports.remove = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw fail("Invalid task id");

  const task = await Task.findById(req.params.id);
  if (!task) throw fail("Task not found", 404);

  const project = await getAccessibleProject(task.project, req.user.id);

  await task.deleteOne();

  const io = req.app.get("io");
  io.to(`project:${project.id}`).emit("task:deleted", { taskId: task.id });
  const NotificationService = require("../notification/notification.service");
  await NotificationService.createForUsers({
    recipientIds: project.members,
    actorId: req.user.id,
    projectId: project.id,
    message: `${req.user.name} deleted task "${task.title}" from ${project.name}`,
    io,
  });

  res.status(204).end();
};
