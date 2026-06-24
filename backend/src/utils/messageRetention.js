const DEFAULT_RETENTION_DAYS = 30;

export const normalizeRetentionDays = (value) => {
  const days = Number.parseInt(value, 10);
  return Number.isInteger(days) && days > 0 ? days : DEFAULT_RETENTION_DAYS;
};

export const cleanupExpiredMessages = async (
  executor,
  retentionDays = DEFAULT_RETENTION_DAYS,
) => {
  const days = normalizeRetentionDays(retentionDays);
  const [messagesResult] = await executor.query(
    `DELETE FROM messages
     WHERE created_at < DATE_SUB(NOW(), INTERVAL ${days} DAY)`,
  );
  const [conversationsResult] = await executor.query(
    `DELETE c
     FROM conversations c
     LEFT JOIN messages m ON m.conversation_id=c.id
     WHERE m.id IS NULL
       AND c.updated_at < DATE_SUB(NOW(), INTERVAL ${days} DAY)`,
  );

  return {
    retentionDays: days,
    deletedMessages: messagesResult.affectedRows || 0,
    deletedConversations: conversationsResult.affectedRows || 0,
  };
};
