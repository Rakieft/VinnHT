import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";

const apiBase = process.env.API_URL || "http://localhost:5056/api";
const requestAmount = 500;
const managerEmail = `wallet.manager.${Date.now()}@vinnht.test`;
const managerPassword = "VinnHT-Wallet-Smoke!2026";

const sessions = {};
let managerId = null;
let requestId = null;
let payout = null;
let walletBefore = null;
let smokeEventKey = null;

const api = async (path, { session, method = "GET", body } = {}) => {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(sessions[session] ? { cookie: sessions[session] } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${data.message || response.status}`);
  }
  return { data, response };
};

const login = async (session, email, password) => {
  const { response } = await api("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error(`Cookie de session manquant pour ${email}.`);
  sessions[session] = cookie;
};

try {
  const [[candidate]] = await pool.query(
    `SELECT po.*,u.email seller_email
     FROM payouts po
     JOIN users u ON u.id=po.seller_id
     JOIN seller_profiles sp ON sp.seller_id=po.seller_id
     WHERE po.status='pending'
       AND u.email='vendeur02@vinnht.test'
       AND sp.moncash_number IS NOT NULL
       AND sp.moncash_account_name IS NOT NULL
     ORDER BY po.id
     LIMIT 1`,
  );
  if (!candidate) {
    throw new Error("Aucun payout de test compatible n'est disponible.");
  }
  payout = candidate;
  const [[existingWallet]] = await pool.query(
    "SELECT * FROM seller_wallets WHERE seller_id=?",
    [payout.seller_id],
  );
  walletBefore = existingWallet || null;
  smokeEventKey = `smoke-wallet-release:${payout.id}:${Date.now()}`;

  const passwordHash = await bcrypt.hash(managerPassword, 12);
  const [manager] = await pool.query(
    `INSERT INTO users (name,email,password_hash,role,status)
     VALUES ('Manager Wallet Smoke',?,?,'manager','active')`,
    [managerEmail, passwordHash],
  );
  managerId = manager.insertId;
  await pool.query(
    "INSERT INTO user_roles (user_id,role) VALUES (?,'manager')",
    [managerId],
  );

  await pool.query(
    `INSERT IGNORE INTO seller_wallets
      (seller_id,available_balance,reserved_balance,total_paid)
     VALUES (?,0,0,0)`,
    [payout.seller_id],
  );
  await pool.query(
    "UPDATE payouts SET status='processing',released_at=NOW() WHERE id=?",
    [payout.id],
  );
  await pool.query(
    "UPDATE seller_wallets SET available_balance=available_balance+? WHERE seller_id=?",
    [payout.amount, payout.seller_id],
  );
  const [[walletPrepared]] = await pool.query(
    "SELECT * FROM seller_wallets WHERE seller_id=?",
    [payout.seller_id],
  );
  await pool.query(
    `INSERT INTO wallet_transactions
      (seller_id,payout_id,event_key,type,amount,available_after,reserved_after,note)
     VALUES (?,?,?,'sale_released',?,?,?,'Crédit temporaire du test wallet')`,
    [
      payout.seller_id,
      payout.id,
      smokeEventKey,
      payout.amount,
      walletPrepared.available_balance,
      walletPrepared.reserved_balance,
    ],
  );

  await login("seller", payout.seller_email, "VinnHT-Test02!2026");
  await login("admin", "admin@vinnht.ht", "VinnHTAdmin2026!");
  await login("manager", managerEmail, managerPassword);

  const created = await api("/seller/wallet/requests", {
    session: "seller",
    method: "POST",
    body: { amount: requestAmount, note: "Test automatique du parcours wallet." },
  });
  requestId = created.data.requestId;

  await api(`/admin/payout-requests/${requestId}/review`, {
    session: "admin",
    method: "PATCH",
    body: { decision: "approved", note: "Demande vérifiée par le test." },
  });
  await api(`/manager/payout-requests/${requestId}/processing`, {
    session: "manager",
    method: "PATCH",
  });
  await api(`/manager/payout-requests/${requestId}/complete`, {
    session: "manager",
    method: "PATCH",
    body: { reference: `SMOKE-${Date.now()}` },
  });

  const walletResult = await api("/seller/wallet", { session: "seller" });
  const paidRequest = walletResult.data.requests.find(
    (request) => Number(request.id) === Number(requestId),
  );
  if (paidRequest?.status !== "paid") {
    throw new Error("La demande n'a pas atteint le statut paid.");
  }
  if (Number(walletResult.data.wallet.reserved_balance) !== Number(walletBefore?.reserved_balance || 0)) {
    throw new Error("Le solde réservé n'est pas revenu à sa valeur initiale.");
  }
  if (
    Number(walletResult.data.wallet.total_paid) !==
    Number(walletBefore?.total_paid || 0) + requestAmount
  ) {
    throw new Error("Le total payé du wallet est incorrect.");
  }

  console.log("Parcours wallet validé : vendeur → admin → manager → payé.");
} finally {
  if (requestId) {
    await pool.query(
      "DELETE FROM notifications WHERE entity_type='payout_request' AND entity_id=?",
      [String(requestId)],
    );
    await pool.query(
      "DELETE FROM audit_logs WHERE entity_type='payout_request' AND entity_id=?",
      [String(requestId)],
    );
    await pool.query(
      "DELETE FROM wallet_transactions WHERE payout_request_id=?",
      [requestId],
    );
    await pool.query("DELETE FROM payout_requests WHERE id=?", [requestId]);
  }
  if (smokeEventKey) {
    await pool.query("DELETE FROM wallet_transactions WHERE event_key=?", [smokeEventKey]);
  }
  if (payout) {
    await pool.query(
      `UPDATE payouts
       SET status=?,released_at=?,payment_reference=?,paid_by=?,paid_at=?
       WHERE id=?`,
      [
        payout.status,
        payout.released_at,
        payout.payment_reference,
        payout.paid_by,
        payout.paid_at,
        payout.id,
      ],
    );
    if (walletBefore) {
      await pool.query(
        `UPDATE seller_wallets
         SET available_balance=?,reserved_balance=?,total_paid=?
         WHERE seller_id=?`,
        [
          walletBefore.available_balance,
          walletBefore.reserved_balance,
          walletBefore.total_paid,
          payout.seller_id,
        ],
      );
    } else {
      await pool.query("DELETE FROM seller_wallets WHERE seller_id=?", [payout.seller_id]);
    }
  }
  if (managerId) {
    await pool.query("DELETE FROM notifications WHERE user_id=?", [managerId]);
    await pool.query("DELETE FROM audit_logs WHERE actor_user_id=?", [managerId]);
    await pool.query("DELETE FROM user_roles WHERE user_id=?", [managerId]);
    await pool.query("DELETE FROM users WHERE id=?", [managerId]);
  }
  await pool.end();
}
