const mongoose = require("mongoose");
const Project = require("./project.model");

const fail = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

async function getAccessibleProject(projectId, userId) {
  if (!mongoose.Types.ObjectId.isValid(projectId))
    throw fail("Invalid project id");

  const project = await Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { members: userId }],
  });

  if (!project) throw fail("Project not found", 404);

  return project;
}

module.exports = { fail, getAccessibleProject };
