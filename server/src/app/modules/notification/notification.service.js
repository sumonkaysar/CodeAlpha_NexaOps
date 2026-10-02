const Notification = require("./notification.model");

exports.createForUsers = async ({
  recipientIds,
  actorId,
  projectId,
  taskId,
  message,
  actorMessage,
  io,
}) => {
  const actor = String(actorId);
  const recipients = [...new Set(recipientIds.map(String))].filter(
    (recipientId) => recipientId !== actor,
  );
  const notificationRecipients = [
    ...recipients.map((recipient) => ({ recipient, message })),
    ...(actorMessage ? [{ recipient: actor, message: actorMessage }] : []),
  ];

  if (!notificationRecipients.length) return [];

  const notifications = await Notification.insertMany(
    notificationRecipients.map(({ recipient, message: recipientMessage }) => ({
      recipient,
      project: projectId,
      task: taskId,
      message: recipientMessage,
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
