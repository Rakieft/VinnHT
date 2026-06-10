CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('client','seller','delivery','supervisor','manager','admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO user_roles (user_id, role)
SELECT id, role FROM users;

INSERT IGNORE INTO user_roles (user_id, role)
SELECT id, 'client' FROM users WHERE role = 'seller';
