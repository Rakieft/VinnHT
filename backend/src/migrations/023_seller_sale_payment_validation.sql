ALTER TABLE seller_sales
  ADD COLUMN payment_status ENUM('pending','proof_submitted','paid','failed') NOT NULL DEFAULT 'pending' AFTER status,
  ADD COLUMN payment_proof_url VARCHAR(500) NULL AFTER payment_status,
  ADD COLUMN payment_proof_note VARCHAR(500) NULL AFTER payment_proof_url,
  ADD COLUMN payment_reference VARCHAR(120) NULL AFTER payment_proof_note,
  ADD COLUMN payment_submitted_at TIMESTAMP NULL AFTER payment_reference,
  ADD COLUMN payment_validated_at TIMESTAMP NULL AFTER payment_submitted_at,
  ADD COLUMN payment_validated_by BIGINT UNSIGNED NULL AFTER payment_validated_at;

UPDATE seller_sales ss
JOIN payments p ON p.order_id=ss.order_id
SET ss.payment_status=CASE
      WHEN p.status='paid' THEN 'paid'
      WHEN p.proof_url IS NOT NULL THEN 'proof_submitted'
      ELSE ss.payment_status
    END,
    ss.payment_proof_url=COALESCE(ss.payment_proof_url,p.proof_url),
    ss.payment_proof_note=COALESCE(ss.payment_proof_note,p.proof_note),
    ss.payment_reference=COALESCE(ss.payment_reference,p.reference),
    ss.payment_submitted_at=COALESCE(ss.payment_submitted_at,p.proof_submitted_at),
    ss.payment_validated_at=CASE WHEN p.status='paid' THEN COALESCE(ss.payment_validated_at,p.paid_at) ELSE ss.payment_validated_at END;

CREATE INDEX idx_seller_sales_payment_status ON seller_sales (seller_id, payment_status);
