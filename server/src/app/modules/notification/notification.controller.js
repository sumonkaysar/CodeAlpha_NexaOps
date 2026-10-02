const Notification = require("./notification.model");

exports.list = async (req, res) => {
  res.json(
    await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50),
  );
};
exports.markRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { $set: { readAt: new Date() } },
    { new: true },
  );
  if (!notification)
    return res.status(404).json({ message: "Notification not found" });
  res.json(notification);
};
