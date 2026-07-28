ALTER TABLE orders
  ADD COLUMN delivery_latitude DECIMAL(10,7) NULL AFTER delivery_address,
  ADD COLUMN delivery_longitude DECIMAL(10,7) NULL AFTER delivery_latitude,
  ADD COLUMN delivery_location_label VARCHAR(255) NULL AFTER delivery_longitude,
  ADD COLUMN delivery_location_source VARCHAR(32) NULL AFTER delivery_location_label,
  ADD COLUMN delivery_location_shared_at DATETIME NULL AFTER delivery_location_source;
