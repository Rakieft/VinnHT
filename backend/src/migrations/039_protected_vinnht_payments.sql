ALTER TABLE payments
  ADD COLUMN validated_by BIGINT UNSIGNED NULL
    AFTER paid_at,
  ADD COLUMN validated_at TIMESTAMP NULL
    AFTER validated_by,
  ADD COLUMN rejection_reason VARCHAR(500) NULL
    AFTER validated_at,
  ADD COLUMN rejected_at TIMESTAMP NULL
    AFTER rejection_reason,
  ADD INDEX idx_payments_admin_review
    (status,proof_submitted_at,validated_at);

ALTER TABLE payouts
  ADD COLUMN released_at TIMESTAMP NULL
    AFTER paid_at,
  ADD COLUMN payment_reference VARCHAR(120) NULL
    AFTER released_at,
  ADD COLUMN paid_by BIGINT UNSIGNED NULL
    AFTER payment_reference,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
    AFTER created_at,
  ADD INDEX idx_payouts_release
    (status,released_at,seller_id);

