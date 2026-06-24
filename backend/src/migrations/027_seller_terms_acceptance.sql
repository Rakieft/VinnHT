ALTER TABLE seller_requests
  ADD COLUMN terms_version VARCHAR(40) NULL AFTER description,
  ADD COLUMN terms_accepted_at TIMESTAMP NULL AFTER terms_version,
  ADD COLUMN terms_acceptance_ip VARCHAR(64) NULL AFTER terms_accepted_at,
  ADD COLUMN terms_snapshot JSON NULL AFTER terms_acceptance_ip;
