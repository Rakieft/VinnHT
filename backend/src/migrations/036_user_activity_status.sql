ALTER TABLE users
  ADD COLUMN activity_status ENUM(
    'school',
    'university',
    'employee',
    'entrepreneur',
    'self_employed',
    'unemployed',
    'other'
  ) NOT NULL DEFAULT 'other' AFTER phone,
  ADD COLUMN activity_organization VARCHAR(190) NULL AFTER activity_status,
  ADD COLUMN activity_details VARCHAR(190) NULL AFTER activity_organization;

CREATE INDEX idx_users_activity_status
  ON users (activity_status);
