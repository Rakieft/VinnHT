ALTER TABLE products
  ADD COLUMN promotional_price DECIMAL(12,2) NULL AFTER price,
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER promotional_price,
  ADD COLUMN offer_ends_at DATETIME NULL AFTER is_featured;

CREATE INDEX idx_products_public_catalog
  ON products (status, stock, created_at);

CREATE INDEX idx_products_public_category
  ON products (category_id, status, stock);

CREATE INDEX idx_products_special_offers
  ON products (is_featured, status, stock, offer_ends_at);
