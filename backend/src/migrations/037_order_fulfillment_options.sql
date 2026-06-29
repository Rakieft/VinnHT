ALTER TABLE orders
  ADD COLUMN fulfillment_method ENUM('pickup','delivery') NOT NULL DEFAULT 'pickup'
    AFTER delivery_address,
  ADD COLUMN delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0
    AFTER fulfillment_method,
  ADD COLUMN fulfillment_snapshot JSON NULL
    AFTER delivery_fee;

ALTER TABLE seller_sales
  ADD COLUMN delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0
    AFTER gross_amount,
  ADD COLUMN pickup_handed_over_at TIMESTAMP NULL
    AFTER payment_validated_at,
  ADD COLUMN pickup_client_confirmed_at TIMESTAMP NULL
    AFTER pickup_handed_over_at,
  ADD COLUMN pickup_confirmed_by BIGINT UNSIGNED NULL
    AFTER pickup_client_confirmed_at,
  ADD INDEX idx_seller_sales_pickup_confirmation
    (seller_id,pickup_handed_over_at,pickup_client_confirmed_at),
  ADD CONSTRAINT fk_seller_sales_pickup_confirmed_by
    FOREIGN KEY (pickup_confirmed_by) REFERENCES users(id) ON DELETE SET NULL;
