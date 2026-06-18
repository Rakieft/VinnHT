ALTER TABLE contact_requests
  ADD COLUMN category VARCHAR(80) NOT NULL DEFAULT 'general' AFTER email,
  ADD COLUMN order_id BIGINT UNSIGNED NULL AFTER category,
  ADD COLUMN reference VARCHAR(40) NULL UNIQUE AFTER order_id,
  ADD COLUMN resolved_at TIMESTAMP NULL AFTER status,
  ADD INDEX idx_contact_requests_user_created (user_id, created_at),
  ADD FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
