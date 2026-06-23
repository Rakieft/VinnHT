UPDATE seller_profiles sp
JOIN seller_requests sr ON sr.user_id = sp.seller_id
JOIN (
  SELECT user_id, MAX(id) latest_request_id
  FROM seller_requests
  WHERE status = 'approved'
  GROUP BY user_id
) latest ON latest.latest_request_id = sr.id
SET
  sp.shop_name = COALESCE(
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sr.description, '$.shopName')), ''),
    sr.business_name,
    sp.shop_name
  ),
  sp.category = COALESCE(
    NULLIF(sp.category, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sr.description, '$.mainCategory')), '')
  ),
  sp.description = COALESCE(
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sr.description, '$.shopDescription')), ''),
    CASE
      WHEN JSON_VALID(sr.description) THEN sp.description
      ELSE COALESCE(NULLIF(sp.description, ''), sr.description)
    END
  ),
  sp.whatsapp = COALESCE(
    NULLIF(sp.whatsapp, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sr.description, '$.primaryPhone')), '')
  ),
  sp.pickup_address = COALESCE(
    NULLIF(sp.pickup_address, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sr.description, '$.pickupAddress')), '')
  ),
  sp.status = 'active'
WHERE sr.status = 'approved'
  AND JSON_VALID(sr.description);
