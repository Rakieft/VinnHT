CREATE TABLE IF NOT EXISTS delivery_proofs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  delivery_id BIGINT UNSIGNED NOT NULL UNIQUE,
  signer_name VARCHAR(160) NOT NULL,
  signature_data MEDIUMTEXT NOT NULL,
  delivery_notes VARCHAR(1000),
  confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_delivery_proofs_confirmed (confirmed_at),
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
);
