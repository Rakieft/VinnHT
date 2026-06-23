ALTER TABLE payments
  ADD COLUMN proof_url VARCHAR(500) NULL AFTER reference,
  ADD COLUMN proof_note VARCHAR(500) NULL AFTER proof_url,
  ADD COLUMN proof_submitted_at TIMESTAMP NULL AFTER proof_note;

CREATE INDEX idx_payments_proof_status ON payments (status, proof_submitted_at);
