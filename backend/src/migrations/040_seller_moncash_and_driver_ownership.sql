ALTER TABLE seller_requests
  ADD COLUMN moncash_number VARCHAR(30) NULL
    AFTER business_name,
  ADD COLUMN moncash_account_name VARCHAR(160) NULL
    AFTER moncash_number;

ALTER TABLE seller_profiles
  ADD COLUMN moncash_number VARCHAR(30) NULL
    AFTER whatsapp,
  ADD COLUMN moncash_account_name VARCHAR(160) NULL
    AFTER moncash_number;

UPDATE seller_requests sr
JOIN users u ON u.id=sr.user_id
SET
  sr.moncash_number=COALESCE(NULLIF(sr.moncash_number,''),NULLIF(u.phone,'')),
  sr.moncash_account_name=COALESCE(NULLIF(sr.moncash_account_name,''),NULLIF(u.name,''));

UPDATE seller_profiles sp
JOIN users u ON u.id=sp.seller_id
SET
  sp.moncash_number=COALESCE(
    NULLIF(sp.moncash_number,''),
    NULLIF(sp.whatsapp,''),
    NULLIF(u.phone,'')
  ),
  sp.moncash_account_name=COALESCE(
    NULLIF(sp.moncash_account_name,''),
    NULLIF(u.name,''),
    NULLIF(sp.shop_name,'')
  );

ALTER TABLE seller_delivery_drivers
  ADD UNIQUE KEY unique_delivery_driver_owner (delivery_user_id);
