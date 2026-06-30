CREATE TABLE IF NOT EXISTS product_pack_options (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  units_per_pack SMALLINT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_product_pack_size (product_id, units_per_pack),
  INDEX idx_product_pack_active (product_id, is_active, units_per_pack),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CHECK (units_per_pack IN (3, 6, 12, 24)),
  CHECK (price > 0)
);

ALTER TABLE cart_items
  ADD COLUMN pack_size SMALLINT UNSIGNED NOT NULL DEFAULT 1 AFTER product_id;

ALTER TABLE cart_items
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (user_id, product_id, pack_size);

ALTER TABLE order_items
  ADD COLUMN pack_size SMALLINT UNSIGNED NOT NULL DEFAULT 1 AFTER quantity,
  ADD COLUMN units_total INT UNSIGNED NOT NULL DEFAULT 1 AFTER pack_size;

UPDATE order_items
SET units_total = quantity
WHERE units_total = 1;
