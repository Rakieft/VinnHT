ALTER TABLE seller_requests
  ADD COLUMN rejection_reason TEXT NULL AFTER status;
