ALTER TABLE seller_sponsorships
  ADD COLUMN payment_reference VARCHAR(120) NULL AFTER amount,
  ADD COLUMN admin_note TEXT NULL AFTER payment_reference,
  ADD COLUMN approved_by BIGINT UNSIGNED NULL AFTER admin_note,
  ADD COLUMN approved_at DATETIME NULL AFTER approved_by,
  ADD COLUMN cancelled_at DATETIME NULL AFTER approved_at,
  ADD INDEX idx_seller_sponsorship_status_dates (status, starts_at, ends_at),
  ADD INDEX idx_seller_sponsorship_approved_by (approved_by);
