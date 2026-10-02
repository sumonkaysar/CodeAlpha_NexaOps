const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
