CREATE TABLE IF NOT EXISTS seller_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id BIGINT UNSIGNED NOT NULL UNIQUE,
  shop_name VARCHAR(160) NOT NULL,
  shop_logo_url VARCHAR(500),
  category VARCHAR(120),
  description TEXT,
  whatsapp VARCHAR(30),
  pickup_address TEXT,
  status ENUM('active','paused') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
