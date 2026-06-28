ALTER TABLE users
  ADD COLUMN education_status ENUM('school','university') NULL AFTER phone,
  ADD COLUMN education_verified_at DATETIME NULL AFTER education_status;

CREATE INDEX idx_users_education_status
  ON users (education_status,education_verified_at);
