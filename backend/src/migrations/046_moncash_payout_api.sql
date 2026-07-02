ALTER TABLE payout_requests
  MODIFY status ENUM(
    'pending','approved','rejected','processing','verification_required',
    'paid','failed','cancelled'
  ) NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS payout_transfer_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payout_request_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'moncash',
  provider_reference VARCHAR(120) NOT NULL UNIQUE,
  provider_transaction_id VARCHAR(160) NULL,
  receiver_snapshot VARCHAR(30) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM(
    'created','submitting','verification_required','successful','failed','manual_review'
  ) NOT NULL DEFAULT 'created',
  provider_status VARCHAR(120) NULL,
  error_code VARCHAR(120) NULL,
  error_message VARCHAR(500) NULL,
  safe_response JSON NULL,
  attempted_by BIGINT UNSIGNED NOT NULL,
  submitted_at TIMESTAMP NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payout_attempt_request (payout_request_id,created_at),
  INDEX idx_payout_attempt_status (status,updated_at),
  UNIQUE KEY unique_provider_transaction (provider,provider_transaction_id),
  FOREIGN KEY (payout_request_id) REFERENCES payout_requests(id),
  FOREIGN KEY (attempted_by) REFERENCES users(id)
);
