INSERT INTO seller_profiles
  (seller_id, shop_name, shop_logo_url, description, status)
SELECT
  sr.user_id,
  sr.business_name,
  sr.shop_logo_url,
  sr.description,
  'active'
FROM seller_requests sr
JOIN (
  SELECT user_id, MAX(id) latest_request_id
  FROM seller_requests
  WHERE status = 'approved'
  GROUP BY user_id
) latest ON latest.latest_request_id = sr.id
LEFT JOIN seller_profiles sp ON sp.seller_id = sr.user_id
WHERE sp.seller_id IS NULL;

UPDATE seller_profiles sp
JOIN seller_requests sr ON sr.user_id = sp.seller_id
JOIN (
  SELECT user_id, MAX(id) latest_request_id
  FROM seller_requests
  WHERE status = 'approved'
  GROUP BY user_id
) latest ON latest.latest_request_id = sr.id
SET
  sp.shop_name = COALESCE(NULLIF(sp.shop_name, ''), sr.business_name),
  sp.shop_logo_url = COALESCE(sp.shop_logo_url, sr.shop_logo_url),
  sp.description = COALESCE(sp.description, sr.description),
  sp.status = 'active'
WHERE sr.status = 'approved';
