CREATE TABLE IF NOT EXISTS seller_wallets (
  seller_id BIGINT UNSIGNED PRIMARY KEY,
  available_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  reserved_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payout_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_number VARCHAR(40) NOT NULL UNIQUE,
  seller_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM(
    'pending',
    'approved',
    'rejected',
    'processing',
    'paid',
    'failed',
    'cancelled'
  ) NOT NULL DEFAULT 'pending',
  moncash_number VARCHAR(30) NOT NULL,
  moncash_account_name VARCHAR(160) NOT NULL,
  seller_note VARCHAR(500) NULL,
  admin_note VARCHAR(500) NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at TIMESTAMP NULL,
  manager_id BIGINT UNSIGNED NULL,
  processing_at TIMESTAMP NULL,
  payment_reference VARCHAR(120) NULL,
  failure_reason VARCHAR(500) NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payout_requests_seller (seller_id,status,created_at),
  INDEX idx_payout_requests_admin (status,created_at),
  INDEX idx_payout_requests_manager (status,reviewed_at),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payout_request_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payout_request_id BIGINT UNSIGNED NOT NULL,
  payout_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_payout_request_item (payout_request_id,payout_id),
  INDEX idx_payout_request_items_payout (payout_id),
  FOREIGN KEY (payout_request_id) REFERENCES payout_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (payout_id) REFERENCES payouts(id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id BIGINT UNSIGNED NOT NULL,
  payout_id BIGINT UNSIGNED NULL,
  payout_request_id BIGINT UNSIGNED NULL,
  event_key VARCHAR(160) NOT NULL UNIQUE,
  type ENUM(
    'sale_released',
    'withdrawal_reserved',
    'withdrawal_released',
    'withdrawal_paid',
    'adjustment'
  ) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  available_after DECIMAL(12,2) NOT NULL,
  reserved_after DECIMAL(12,2) NOT NULL,
  actor_id BIGINT UNSIGNED NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wallet_transactions_seller (seller_id,created_at),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (payout_id) REFERENCES payouts(id),
  FOREIGN KEY (payout_request_id) REFERENCES payout_requests(id),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

INSERT IGNORE INTO seller_wallets
  (seller_id,available_balance,reserved_balance,total_paid)
SELECT
  seller_id,
  COALESCE(SUM(CASE WHEN status='processing' THEN amount ELSE 0 END),0),
  0,
  COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END),0)
FROM payouts
GROUP BY seller_id;

INSERT IGNORE INTO wallet_transactions
  (seller_id,payout_id,event_key,type,amount,available_after,reserved_after,note,created_at)
SELECT
  po.seller_id,
  po.id,
  CONCAT('legacy-release:',po.id),
  'sale_released',
  po.amount,
  0,
  0,
  'Import de l’historique existant',
  COALESCE(po.released_at,po.created_at)
FROM payouts po
WHERE po.status IN ('processing','paid');
