CREATE TABLE IF NOT EXISTS user_terms_acceptances (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  terms_version VARCHAR(40) NOT NULL,
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acceptance_ip VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  terms_snapshot JSON NOT NULL,
  UNIQUE KEY unique_user_terms_version (user_id, terms_version),
  INDEX idx_user_terms_accepted (accepted_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
