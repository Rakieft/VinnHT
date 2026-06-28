ALTER TABLE cart_items
  ADD COLUMN price_snapshot DECIMAL(12,2) NULL AFTER quantity;

UPDATE cart_items ci
JOIN products p ON p.id=ci.product_id
SET ci.price_snapshot=CASE
  WHEN p.is_featured=TRUE
    AND p.promotional_price IS NOT NULL
    AND p.promotional_price<p.price
    AND (p.offer_ends_at IS NULL OR p.offer_ends_at>NOW())
  THEN p.promotional_price
  ELSE p.price
END
WHERE ci.price_snapshot IS NULL;
