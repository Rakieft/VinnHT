CREATE TABLE IF NOT EXISTS delivery_receipt_confirmations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  seller_delivery_assignment_id BIGINT UNSIGNED NULL,
  delivery_id BIGINT UNSIGNED NULL,
  client_id BIGINT UNSIGNED NOT NULL,
  signature_acknowledged TINYINT(1) NOT NULL DEFAULT 1,
  confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_seller_delivery_receipt (seller_delivery_assignment_id),
  UNIQUE KEY unique_main_delivery_receipt (delivery_id),
  INDEX idx_delivery_receipt_order (order_id, confirmed_at),
  INDEX idx_delivery_receipt_client (client_id, confirmed_at),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_delivery_assignment_id)
    REFERENCES seller_delivery_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);
