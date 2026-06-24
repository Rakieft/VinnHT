CREATE TABLE IF NOT EXISTS support_request_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  sender_role VARCHAR(30) NOT NULL,
  body VARCHAR(3000) NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_support_message_request_created (request_id, created_at),
  INDEX idx_support_message_unread (request_id, read_at),
  FOREIGN KEY (request_id) REFERENCES contact_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
