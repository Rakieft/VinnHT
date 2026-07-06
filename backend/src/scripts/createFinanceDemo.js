import "dotenv/config";
import pool from "../config/database.js";

const DEMO_MARKER = "DEMO_FINANCE_VINNHT";
const TEST_SELLER_EMAIL = "vendeur02@vinnht.test";

const connection = await pool.getConnection();

try {
  await connection.beginTransaction();

  const [[existingRequest]] = await connection.query(
    `SELECT
       pr.id,
       pr.request_number,
       pr.amount,
       pr.status,
       COALESCE(sp.shop_name,u.name) shop_name
     FROM payout_requests pr
     JOIN users u ON u.id=pr.seller_id
     LEFT JOIN seller_profiles sp ON sp.seller_id=pr.seller_id
     WHERE pr.seller_note LIKE ?
     ORDER BY pr.id DESC
     LIMIT 1
     FOR UPDATE`,
    [`${DEMO_MARKER}%`],
  );

  if (existingRequest) {
    await connection.commit();
    console.log("La démonstration Finance existe déjà.");
    console.log(`Demande : ${existingRequest.request_number}`);
    console.log(`Boutique : ${existingRequest.shop_name}`);
    console.log(`Montant : ${Number(existingRequest.amount).toFixed(2)} HTG`);
    console.log(`Statut : ${existingRequest.status}`);
    process.exitCode = 0;
  } else {
    const [[candidate]] = await connection.query(
      `SELECT
         po.id payout_id,
         po.amount payout_amount,
         po.seller_id,
         po.seller_sale_id,
         ss.order_id,
         o.client_id,
         o.order_number,
         o.fulfillment_method,
         COALESCE(sp.shop_name,u.name) shop_name,
         sp.moncash_number,
         sp.moncash_account_name
       FROM payouts po
       JOIN seller_sales ss ON ss.id=po.seller_sale_id
       JOIN orders o ON o.id=ss.order_id
       JOIN users u ON u.id=po.seller_id
       JOIN seller_profiles sp ON sp.seller_id=po.seller_id
       WHERE po.status='pending'
         AND u.email=?
         AND sp.moncash_number IS NOT NULL
         AND sp.moncash_number<>''
         AND sp.moncash_account_name IS NOT NULL
         AND sp.moncash_account_name<>''
         AND NOT EXISTS (
           SELECT 1
           FROM payout_request_items pri
           WHERE pri.payout_id=po.id
         )
       ORDER BY po.id
       LIMIT 1
       FOR UPDATE`,
      [TEST_SELLER_EMAIL],
    );

    if (!candidate) {
      throw new Error(
        "Aucune vente de test en attente n'est disponible pour créer la démonstration Finance.",
      );
    }

    const [[admin]] = await connection.query(
      `SELECT id
       FROM users
       WHERE role='admin' AND status='active'
       ORDER BY id
       LIMIT 1`,
    );

    if (!admin) {
      throw new Error("Aucun administrateur actif n'est disponible pour approuver la demande.");
    }

    await connection.query(
      `UPDATE orders
       SET status='delivered'
       WHERE id=?`,
      [candidate.order_id],
    );
    await connection.query(
      `UPDATE payments
       SET status='paid',paid_at=COALESCE(paid_at,NOW())
       WHERE order_id=?`,
      [candidate.order_id],
    );
    await connection.query(
      `UPDATE seller_sales
       SET status='completed',payment_status='paid',
           payment_validated_at=COALESCE(payment_validated_at,NOW())
       WHERE id=?`,
      [candidate.seller_sale_id],
    );
    await connection.query(
      `UPDATE deliveries
       SET status='delivered',delivered_at=COALESCE(delivered_at,NOW())
       WHERE order_id=?`,
      [candidate.order_id],
    );
    await connection.query(
      `UPDATE seller_delivery_assignments
       SET status='delivered',delivered_at=COALESCE(delivered_at,NOW()),
           confirmed_at=COALESCE(confirmed_at,NOW())
       WHERE seller_sale_id=?`,
      [candidate.seller_sale_id],
    );

    if (candidate.fulfillment_method === "pickup") {
      await connection.query(
        `UPDATE seller_sales
         SET pickup_handed_over_at=COALESCE(pickup_handed_over_at,NOW()),
             pickup_client_confirmed_at=COALESCE(pickup_client_confirmed_at,NOW()),
             pickup_confirmed_by=COALESCE(pickup_confirmed_by,?)
         WHERE id=?`,
        [candidate.client_id, candidate.seller_sale_id],
      );
    }

    await connection.query(
      `INSERT IGNORE INTO seller_wallets
        (seller_id,available_balance,reserved_balance,total_paid)
       VALUES (?,0,0,0)`,
      [candidate.seller_id],
    );
    await connection.query(
      `UPDATE payouts
       SET status='processing',released_at=COALESCE(released_at,NOW())
       WHERE id=?`,
      [candidate.payout_id],
    );
    await connection.query(
      `UPDATE seller_wallets
       SET available_balance=available_balance+?
       WHERE seller_id=?`,
      [candidate.payout_amount, candidate.seller_id],
    );

    const [[creditedWallet]] = await connection.query(
      `SELECT available_balance,reserved_balance
       FROM seller_wallets
       WHERE seller_id=?
       FOR UPDATE`,
      [candidate.seller_id],
    );

    await connection.query(
      `INSERT INTO wallet_transactions
        (seller_id,payout_id,event_key,type,amount,available_after,reserved_after,note)
       VALUES (?,?,?,'sale_released',?,?,?,?)`,
      [
        candidate.seller_id,
        candidate.payout_id,
        `${DEMO_MARKER}:release:${candidate.payout_id}`,
        candidate.payout_amount,
        creditedWallet.available_balance,
        creditedWallet.reserved_balance,
        `Commande ${candidate.order_number} livrée et confirmée (simulation).`,
      ],
    );

    const timestamp = Date.now().toString(36).toUpperCase();
    const requestNumber = `PAY-DEMO-${timestamp}`;
    const [requestResult] = await connection.query(
      `INSERT INTO payout_requests
        (request_number,seller_id,amount,status,moncash_number,
         moncash_account_name,seller_note,admin_note,reviewed_by,reviewed_at)
       VALUES (?,?,?,'approved',?,?,?,?,?,NOW())`,
      [
        requestNumber,
        candidate.seller_id,
        candidate.payout_amount,
        candidate.moncash_number,
        candidate.moncash_account_name,
        `${DEMO_MARKER} - Paiement demandé après livraison confirmée de ${candidate.order_number}.`,
        "Demande de démonstration vérifiée et approuvée par l’administration.",
        admin.id,
      ],
    );

    await connection.query(
      `UPDATE seller_wallets
       SET available_balance=available_balance-?,
           reserved_balance=reserved_balance+?
       WHERE seller_id=?`,
      [candidate.payout_amount, candidate.payout_amount, candidate.seller_id],
    );
    await connection.query(
      `INSERT INTO payout_request_items
        (payout_request_id,payout_id,amount)
       VALUES (?,?,?)`,
      [requestResult.insertId, candidate.payout_id, candidate.payout_amount],
    );

    const [[reservedWallet]] = await connection.query(
      `SELECT available_balance,reserved_balance
       FROM seller_wallets
       WHERE seller_id=?`,
      [candidate.seller_id],
    );

    await connection.query(
      `INSERT INTO wallet_transactions
        (seller_id,payout_id,payout_request_id,event_key,type,amount,
         available_after,reserved_after,actor_id,note)
       VALUES (?,?,?,?, 'withdrawal_reserved',?,?,?,?,?)`,
      [
        candidate.seller_id,
        candidate.payout_id,
        requestResult.insertId,
        `${DEMO_MARKER}:reserve:${requestResult.insertId}`,
        candidate.payout_amount,
        reservedWallet.available_balance,
        reservedWallet.reserved_balance,
        candidate.seller_id,
        "Montant réservé pour la demande de paiement de démonstration.",
      ],
    );

    await connection.commit();

    console.log("Démonstration Finance créée avec succès.");
    console.log(`Commande livrée : ${candidate.order_number}`);
    console.log(`Boutique : ${candidate.shop_name}`);
    console.log(`Demande : ${requestNumber}`);
    console.log(`Montant : ${Number(candidate.payout_amount).toFixed(2)} HTG`);
    console.log("Statut : approved (prête pour Finance, aucun transfert réel effectué)");
  }
} catch (error) {
  await connection.rollback();
  console.error(error.message);
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
