const Project = require("./project.model");
const User = require("../user/user.model");
const { fail, getAccessibleProject } = require("./project.service");

exports.list = async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user.id }, { members: req.user.id }],
  })
    .populate("owner", "name email")
    .populate("members", "name email")
    .sort({ updatedAt: -1 });

  res.json(projects);
};

exports.create = async (req, res) => {
  const { name, description = "" } = req.body;

  if (typeof name !== "string" || !name.trim())
    throw fail("Project name is required");

  const project = await Project.create({
    name: name.trim(),
    description,
    owner: req.user.id,
    members: [req.user.id],
  });

  res.status(201).json(project);
};

exports.get = async (req, res) => {
  const project = await getAccessibleProject(req.params.id, req.user.id);
  res.json(await project.populate("members", "name email"));
};

exports.update = async (req, res) => {
  const project = await getAccessibleProject(req.params.id, req.user.id);

  if (String(project.owner) !== req.user.id)
    throw fail("Only the project owner can update it", 403);

  const updates = {};

  if (req.body.name !== undefined) {
    if (typeof req.body.name !== "string" || !req.body.name.trim())
      throw fail("Project name cannot be empty");
    updates.name = req.body.name.trim();
  }

  if (req.body.description !== undefined)
    updates.description = req.body.description;

  if (req.body.members !== undefined) {
    if (!Array.isArray(req.body.members))
      throw fail("Members must be an array of user ids");
    updates.members = [
      ...new Set([req.user.id, ...req.body.members.map(String)]),
    ];
  }

  Object.assign(project, updates);
  await project.save();

  req.app
    .get("io")
    .to(`project:${project.id}`)
    .emit("project:updated", project);

  res.json(project);
};

exports.remove = async (req, res) => {
  const project = await getAccessibleProject(req.params.id, req.user.id);

  if (String(project.owner) !== req.user.id)
    throw fail("Only the project owner can delete it", 403);

  await project.deleteOne();

  req.app
    .get("io")
    .to(`project:${project.id}`)
    .emit("project:deleted", { projectId: project.id });

  res.status(204).end();
};

exports.addMember = async (req, res) => {
  const project = await getAccessibleProject(req.params.id, req.user.id);
  if (String(project.owner) !== req.user.id)
    throw fail("Only the project owner can invite members", 403);

  if (typeof req.body.email !== "string" || !req.body.email.trim())
    throw fail("A member email is required");

  const member = await User.findOne({
    email: req.body.email.trim().toLowerCase(),
  });

  if (!member) throw fail("No account found for that email", 404);
  if (!project.members.some((userId) => String(userId) === member.id)) {
    project.members.push(member.id);
    await project.save();
  }

  const result = await project.populate("members", "name email");
  req.app.get("io").to(`project:${project.id}`).emit("project:updated", result);

  res.json(result);
};
