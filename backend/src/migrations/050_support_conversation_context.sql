ALTER TABLE conversations
  ADD COLUMN support_context ENUM('marketplace','support_client','support_seller')
    NOT NULL DEFAULT 'marketplace'
    AFTER seller_id;

UPDATE conversations c
JOIN users seller ON seller.id=c.seller_id
SET c.support_context='support_client'
WHERE seller.role IN ('support','admin');

ALTER TABLE conversations
  DROP INDEX unique_client_seller_conversation,
  ADD UNIQUE KEY unique_client_seller_context_conversation
    (client_id,seller_id,support_context);
