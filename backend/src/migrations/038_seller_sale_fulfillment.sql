ALTER TABLE orders
  MODIFY COLUMN fulfillment_method ENUM('pickup','delivery','mixed')
    NOT NULL DEFAULT 'pickup';

ALTER TABLE seller_sales
  ADD COLUMN fulfillment_method ENUM('pickup','delivery')
    NOT NULL DEFAULT 'pickup'
    AFTER delivery_fee,
  ADD COLUMN delivery_address TEXT NULL
    AFTER fulfillment_method,
  ADD INDEX idx_seller_sales_fulfillment
    (seller_id,fulfillment_method,status);

UPDATE seller_sales ss
JOIN orders o ON o.id=ss.order_id
SET
  ss.fulfillment_method = CASE
    WHEN o.fulfillment_method='delivery' THEN 'delivery'
    ELSE 'pickup'
  END,
  ss.delivery_address = CASE
    WHEN o.fulfillment_method='delivery' THEN o.delivery_address
    ELSE NULL
  END;
