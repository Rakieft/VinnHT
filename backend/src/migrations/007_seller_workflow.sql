ALTER TABLE seller_sales
  MODIFY status ENUM(
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'completed',
    'cancelled'
  ) NOT NULL DEFAULT 'pending';

ALTER TABLE seller_profiles
  ADD COLUMN opening_hours VARCHAR(190) NULL AFTER pickup_address,
  ADD COLUMN delivery_zones TEXT NULL AFTER opening_hours;

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

INSERT INTO product_images (product_id, image_url, position)
SELECT p.id, p.image_url, 0
FROM products p
WHERE p.image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id
  );
