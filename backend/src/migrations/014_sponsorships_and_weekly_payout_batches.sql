CREATE TABLE IF NOT EXISTS product_sponsorships (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  keyword VARCHAR(120) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending','active','expired','cancelled') NOT NULL DEFAULT 'pending',
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sponsorship_search (status, keyword, starts_at, ends_at),
  INDEX idx_sponsorship_seller (seller_id, status),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payout_batches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  scheduled_for DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('prepared','processing','paid','cancelled') NOT NULL DEFAULT 'prepared',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_payout_batch_period (period_start, period_end)
);

CREATE TABLE IF NOT EXISTS payout_batch_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  batch_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  sale_count INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('prepared','paid','failed') NOT NULL DEFAULT 'prepared',
  paid_at TIMESTAMP NULL,
  UNIQUE KEY unique_batch_seller (batch_id, seller_id),
  FOREIGN KEY (batch_id) REFERENCES payout_batches(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
