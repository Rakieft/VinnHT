export const DEFAULT_DELIVERY_HISTORY_RETENTION_DAYS = 60;

export const normalizeDeliveryRetentionDays = (value) => {
  const days = Number.parseInt(value, 10);
  if (!Number.isFinite(days) || days < 1) {
    return DEFAULT_DELIVERY_HISTORY_RETENTION_DAYS;
  }
  return Math.min(days, 365);
};

export const deliveryHistoryCutoffSql = (value) => {
  const days = normalizeDeliveryRetentionDays(value);
  return `DATE_SUB(NOW(), INTERVAL ${days} DAY)`;
};
