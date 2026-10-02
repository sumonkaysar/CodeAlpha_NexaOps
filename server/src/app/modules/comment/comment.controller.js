const mongoose = require("mongoose");
const Comment = require("./comment.model");
const Task = require("../task/task.model");
const { fail, getAccessibleProject } = require("../project/project.service");

exports.list = async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw fail("Task not found", 404);
  await getAccessibleProject(task.project, req.user.id);
  res.json(
    await Comment.find({ task: task.id })
      .populate("author", "name")
      .sort({ createdAt: 1 }),
  );
};

exports.create = async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw fail("Task not found", 404);
  await getAccessibleProject(task.project, req.user.id);
  if (typeof req.body.body !== "string" || !req.body.body.trim())
    throw fail("Comment cannot be empty");
  const comment = await Comment.create({
    task: task.id,
    author: req.user.id,
    body: req.body.body.trim(),
  });
  const result = await comment.populate("author", "name");
  req.app
    .get("io")
    .to(`project:${task.project}`)
    .emit("comment:created", result);
  res.status(201).json(result);
};

exports.remove = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.commentId))
    throw fail("Invalid comment id");
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw fail("Comment not found", 404);
  if (String(comment.author) !== req.user.id)
    throw fail("Only the author can delete this comment", 403);
  await comment.deleteOne();
  res.status(204).end();
};
