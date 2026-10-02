const Notification = require("./notification.model");

exports.createForUsers = async ({
  recipientIds,
  actorId,
  projectId,
  taskId,
  message,
  io,
}) => {
  const recipients = [
    ...new Set(
      recipientIds
        .map(String)
        .filter((recipientId) => recipientId !== String(actorId)),
    ),
  ];

  if (!recipients.length) return [];

  const notifications = await Notification.insertMany(
    recipients.map((recipient) => ({
      recipient,
      project: projectId,
      task: taskId,
      message,
    })),
  );

  for (const notification of notifications) {
    io.to(`user:${notification.recipient}`).emit(
      "notification:new",
      notification,
    );
  }

  return notifications;
};
