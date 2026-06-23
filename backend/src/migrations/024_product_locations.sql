ALTER TABLE products
  ADD COLUMN department VARCHAR(80) NULL AFTER stock,
  ADD COLUMN city VARCHAR(120) NULL AFTER department;

UPDATE products p
LEFT JOIN seller_profiles sp ON sp.seller_id=p.seller_id
SET p.department=COALESCE(NULLIF(p.department,''),'Ouest'),
    p.city=COALESCE(NULLIF(p.city,''),NULLIF(sp.pickup_address,''),'Haiti')
WHERE p.department IS NULL OR p.department='' OR p.city IS NULL OR p.city='';

CREATE INDEX idx_products_location ON products (department, city, status, stock);
