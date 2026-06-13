import "dotenv/config";
import pool from "../config/database.js";

const marketplaceTables = [
  "messages",
  "conversations",
  "notifications",
  "favorites",
  "cart_items",
  "shop_reviews",
  "delivery_proofs",
  "deliveries",
  "payouts",
  "payout_batch_items",
  "payout_batches",
  "seller_sales",
  "payments",
  "order_items",
  "orders",
  "product_sponsorships",
  "seller_sponsorships",
  "product_images",
  "products",
  "seller_profiles",
  "seller_requests",
  "contact_requests",
  "user_preferences",
  "audit_logs",
];

const connection = await pool.getConnection();

try {
  await connection.query("SET FOREIGN_KEY_CHECKS=0");
  for (const table of marketplaceTables) {
    await connection.query(`DELETE FROM \`${table}\``);
  }
  await connection.query(
    `DELETE FROM user_roles
     WHERE user_id NOT IN (
       SELECT id FROM users WHERE role='admin'
     )`,
  );
  await connection.query("DELETE FROM users WHERE role<>'admin'");
  await connection.query(
    `DELETE FROM user_roles
     WHERE role<>'admin'
        OR user_id NOT IN (SELECT id FROM users WHERE role='admin')`,
  );
  await connection.query(
    `INSERT IGNORE INTO user_roles (user_id,role)
     SELECT id,'admin' FROM users WHERE role='admin'`,
  );
  console.log("VinnHT nettoyé : comptes admin et catégories conservés.");
} finally {
  await connection.query("SET FOREIGN_KEY_CHECKS=1");
  connection.release();
  await pool.end();
}
