ALTER TABLE seller_sales
  ADD COLUMN payment_rejection_reason VARCHAR(500) NULL AFTER payment_proof_note,
  ADD COLUMN payment_rejected_at TIMESTAMP NULL AFTER payment_submitted_at;

CREATE TABLE IF NOT EXISTS order_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  seller_sale_id BIGINT UNSIGNED NULL,
  actor_id BIGINT UNSIGNED NULL,
  actor_role VARCHAR(40) NULL,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_events_order (order_id, created_at),
  INDEX idx_order_events_seller_sale (seller_sale_id, created_at),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_sale_id) REFERENCES seller_sales(id) ON DELETE SET NULL,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);
