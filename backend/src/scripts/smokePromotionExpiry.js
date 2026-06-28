import "dotenv/config";
import pool from "../config/database.js";

const apiUrl = process.env.API_URL || "http://localhost:5056/api";
const testEmail = "vendeur01@vinnht.test";
const testPassword = "VinnHT-Test01!2026";
const productSlug = "test-tech-ayiti-jbl-tune-510bt";

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const connection = await pool.getConnection();
let originalProduct;
let originalCart;
let product;
let testUser;

try {
  [[product]] = await connection.query(
    `SELECT id,price,promotional_price,is_featured,offer_ends_at
     FROM products
     WHERE slug=?`,
    [productSlug],
  );
  [[testUser]] = await connection.query(
    "SELECT id FROM users WHERE email=?",
    [testEmail],
  );

  if (!product || !testUser) {
    throw new Error("Les donnees de test vendeur sont absentes.");
  }

  originalProduct = { ...product };
  [[originalCart]] = await connection.query(
    `SELECT quantity,price_snapshot,created_at,updated_at
     FROM cart_items
     WHERE user_id=? AND product_id=?`,
    [testUser.id, product.id],
  );

  const promotionalPrice = Math.round(Number(product.price) * 0.7);
  await connection.query(
    `UPDATE products
     SET promotional_price=?,is_featured=TRUE,offer_ends_at=DATE_ADD(NOW(),INTERVAL 5 SECOND)
     WHERE id=?`,
    [promotionalPrice, product.id],
  );

  const loginResponse = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  if (!loginResponse.ok) {
    throw new Error(`Connexion de test impossible: ${loginResponse.status}`);
  }

  const cookie = loginResponse.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Cookie de session de test absent.");

  const apiRequest = async (path, options = {}) => {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        Cookie: cookie,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`${path}: ${response.status} ${await response.text()}`);
    }
    return response.json();
  };

  await apiRequest(`/cart/${product.id}`, {
    method: "PUT",
    body: JSON.stringify({ quantity: 1 }),
  });

  const beforeExpiration = (await apiRequest("/cart")).find(
    (item) => Number(item.id) === Number(product.id),
  );
  if (
    Number(beforeExpiration?.price) !== promotionalPrice ||
    beforeExpiration?.price_changed
  ) {
    throw new Error("Le prix promotionnel initial du panier est incorrect.");
  }

  await delay(6_000);

  const afterExpiration = (await apiRequest("/cart")).find(
    (item) => Number(item.id) === Number(product.id),
  );
  if (
    Number(afterExpiration?.price) !== Number(product.price) ||
    Number(afterExpiration?.previous_price) !== promotionalPrice ||
    !afterExpiration?.price_changed
  ) {
    throw new Error("Le changement de prix apres expiration n'a pas ete detecte.");
  }

  const acknowledged = (await apiRequest("/cart")).find(
    (item) => Number(item.id) === Number(product.id),
  );
  if (acknowledged?.price_changed) {
    throw new Error("L'avertissement de prix devrait etre emis une seule fois.");
  }

  console.table({
    before: {
      price: Number(beforeExpiration.price),
      changed: beforeExpiration.price_changed,
    },
    expired: {
      previous: Number(afterExpiration.previous_price),
      price: Number(afterExpiration.price),
      changed: afterExpiration.price_changed,
    },
    acknowledged: {
      price: Number(acknowledged.price),
      changed: acknowledged.price_changed,
    },
  });
} finally {
  if (product && originalProduct) {
    await connection.query(
      `UPDATE products
       SET promotional_price=?,is_featured=?,offer_ends_at=?
       WHERE id=?`,
      [
        originalProduct.promotional_price,
        originalProduct.is_featured,
        originalProduct.offer_ends_at,
        product.id,
      ],
    );
  }

  if (product && testUser) {
    if (originalCart) {
      await connection.query(
        `INSERT INTO cart_items
          (user_id,product_id,quantity,price_snapshot,created_at,updated_at)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
          quantity=VALUES(quantity),
          price_snapshot=VALUES(price_snapshot),
          created_at=VALUES(created_at),
          updated_at=VALUES(updated_at)`,
        [
          testUser.id,
          product.id,
          originalCart.quantity,
          originalCart.price_snapshot,
          originalCart.created_at,
          originalCart.updated_at,
        ],
      );
    } else {
      await connection.query(
        "DELETE FROM cart_items WHERE user_id=? AND product_id=?",
        [testUser.id, product.id],
      );
    }
  }

  connection.release();
  await pool.end();
}
