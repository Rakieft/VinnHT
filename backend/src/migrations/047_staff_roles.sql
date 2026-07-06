ALTER TABLE users
  MODIFY role ENUM(
    'client','seller','delivery','supervisor','manager','support','finance','admin'
  ) NOT NULL DEFAULT 'client';

ALTER TABLE user_roles
  MODIFY role ENUM(
    'client','seller','delivery','supervisor','manager','support','finance','admin'
  ) NOT NULL;

ALTER TABLE notifications
  MODIFY role ENUM(
    'client','seller','delivery','supervisor','manager','support','finance','admin'
  ) NULL;
