import "dotenv/config";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const backendDirectory = fileURLToPath(new URL("../../", import.meta.url));
const migrationsDirectory = path.join(backendDirectory, "src", "migrations");
const databaseName = `vinnht_smoke_${Date.now()}`;
const port = 5067;
const apiOrigin = `http://localhost:${port}/api`;
const password = "VinnHTSmoke2026!";
let server;
let database;
let paymentProofPath;

const rootConnectionOptions = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
};

const waitForApi = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${apiOrigin}/health`);
      if (response.ok) return;
    } catch {
      // Le serveur démarre encore.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Le serveur de simulation n'a pas démarré.");
};

const request = async (route, { method = "GET", cookie, body } = {}) => {
  const headers = {};
  let payload = body;

  if (cookie) headers.cookie = cookie;
  if (body && !(body instanceof FormData)) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${apiOrigin}${route}`, {
    method,
    headers,
    body: payload,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${method} ${route}: ${response.status} ${data?.message || text}`);
  }

  return {
    data,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
};

const register = async ({ name, email, phone }) =>
  request("/auth/register", {
    method: "POST",
    body: { name, email, phone, password },
  });

const login = async (email) =>
  request("/auth/login", {
    method: "POST",
    body: { email, password },
  });

const createTemporaryDatabase = async () => {
  const root = await mysql.createConnection(rootConnectionOptions);
  await root.query(
    `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await root.changeUser({ database: databaseName });

  const migrations = (await fs.readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const migration of migrations) {
    const sql = await fs.readFile(path.join(migrationsDirectory, migration), "utf8");
    await root.query(sql);
  }
  await root.end();

  database = await mysql.createConnection({
    ...rootConnectionOptions,
    database: databaseName,
  });
};

const startTemporaryServer = async () => {
  server = spawn(process.execPath, ["src/server.js"], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      PORT: String(port),
      DB_NAME: databaseName,
      FRONTEND_URL: "http://localhost:3000",
      IMAGE_STORAGE: "local",
      COMMISSION_RATE: "0",
      JWT_SECRET: "vinnht-smoke-secret-only-for-local-validation",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let serverError = "";
  server.stderr.on("data", (chunk) => {
    serverError += chunk.toString();
  });
  server.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(serverError);
    }
  });
  await waitForApi();
};

const runFlow = async () => {
  const suffix = Date.now();
  const adminEmail = `smoke.admin.${suffix}@vinnht.test`;
  const managerEmail = `smoke.manager.${suffix}@vinnht.test`;
  const sellerEmail = `smoke.seller.${suffix}@vinnht.test`;
  const buyerEmail = `smoke.buyer.${suffix}@vinnht.test`;
  const driverEmail = `smoke.driver.${suffix}@vinnht.test`;
  const managerHash = await bcrypt.hash(password, 12);

  const anonymousSession = await request("/auth/me");
  assert.equal(anonymousSession.data.user, null);

  const [managerResult] = await database.query(
    `INSERT INTO users (name,email,password_hash,role,status)
     VALUES (?,?,?,'manager','active')`,
    ["Manager Smoke", managerEmail, managerHash],
  );
  await database.query(
    "INSERT INTO user_roles (user_id,role) VALUES (?,'manager')",
    [managerResult.insertId],
  );
  const [adminResult] = await database.query(
    `INSERT INTO users (name,email,password_hash,role,status)
     VALUES (?,?,?,'admin','active')`,
    ["Admin Support Smoke", adminEmail, managerHash],
  );
  await database.query(
    "INSERT INTO user_roles (user_id,role) VALUES (?,'admin')",
    [adminResult.insertId],
  );

  const sellerRegistration = await register({
    name: "Vendeur Smoke",
    email: sellerEmail,
    phone: "37000001",
  });
  const sellerRequest = new FormData();
  sellerRequest.append("businessName", "Boutique Smoke VinnHT");
  sellerRequest.append("description", "Boutique temporaire pour la validation finale.");
  sellerRequest.append("termsAccepted", "true");
  sellerRequest.append("termsVersion", "2026-06-24-v2");
  await request("/seller/requests", {
    method: "POST",
    cookie: sellerRegistration.cookie,
    body: sellerRequest,
  });

  const [[requestRow]] = await database.query(
    "SELECT id FROM seller_requests WHERE user_id=?",
    [sellerRegistration.data.user.id],
  );
  const manager = await login(managerEmail);
  await request(`/admin/seller-requests/${requestRow.id}`, {
    method: "PATCH",
    cookie: manager.cookie,
    body: { status: "approved" },
  });

  const seller = await login(sellerEmail);
  assert(seller.data.user.roles.includes("seller"));

  const shopForm = new FormData();
  shopForm.append("shopName", "Boutique Smoke VinnHT");
  shopForm.append("category", "Électronique");
  shopForm.append("description", "Validation automatique du parcours VinnHT.");
  shopForm.append("whatsapp", "37000001");
  shopForm.append("pickupAddress", "Delmas 33, Port-au-Prince");
  shopForm.append("openingHours", "Lun-Sam 8h-18h");
  shopForm.append("deliveryZones", "Ouest");
  shopForm.append("status", "active");
  await request("/seller/shop", {
    method: "PATCH",
    cookie: seller.cookie,
    body: shopForm,
  });

  const [[category]] = await database.query(
    "SELECT id FROM categories WHERE slug='autres' LIMIT 1",
  );
  assert(category?.id, "Aucune catégorie disponible après les migrations.");

  const createdProduct = await request("/products", {
    method: "POST",
    cookie: seller.cookie,
    body: {
      name: "Produit Smoke VinnHT",
      categoryId: category.id,
      description: "Produit temporaire de validation.",
      price: 2500,
      stock: 5,
      attributes: {
        condition: "Neuf",
      },
      department: "Ouest",
      city: "Delmas",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    },
  });

  await request("/seller/delivery-drivers", {
    method: "POST",
    cookie: seller.cookie,
    body: {
      name: "Livreur Smoke",
      email: driverEmail,
      phone: "37000002",
      password,
      zones: "Ouest",
      vehicleType: "Moto",
    },
  });
  const [[driverUser]] = await database.query(
    "SELECT id FROM users WHERE email=?",
    [driverEmail],
  );
  await database.query(
    "UPDATE users SET profile_image_url='/uploads/profiles/smoke-driver.png' WHERE id=?",
    [driverUser.id],
  );

  const buyer = await register({
    name: "Client Smoke",
    email: buyerEmail,
    phone: "37000003",
  });
  const supportConversation = await request("/messages/support", {
    method: "POST",
    cookie: buyer.cookie,
  });
  await request(`/messages/conversations/${supportConversation.data.id}`, {
    method: "POST",
    cookie: buyer.cookie,
    body: { body: "Bonjour Support VinnHT, ceci est un test." },
  });
  const admin = await login(adminEmail);
  await request("/contact", {
    method: "POST",
    body: {
      name: "Contact Public Smoke",
      email: `contact.${suffix}@vinnht.test`,
      phone: "38000009",
      category: "general",
      subject: "Question avant achat",
      message: "Je souhaite vérifier le dossier support avec téléphone.",
    },
  });
  const supportRequests = await request("/admin/contact-requests", {
    cookie: admin.cookie,
  });
  const publicContact = supportRequests.data.find(
    (item) => item.name === "Contact Public Smoke",
  );
  assert(publicContact);
  assert.equal(publicContact.phone, "38000009");
  assert.equal(publicContact.subject, "Question avant achat");

  const adminConversations = await request("/messages/conversations", {
    cookie: admin.cookie,
  });
  const receivedSupportConversation = adminConversations.data.find(
    (conversation) => Number(conversation.id) === Number(supportConversation.data.id),
  );
  assert(receivedSupportConversation);
  assert.equal(receivedSupportConversation.name, "Client Smoke");
  assert.equal(Number(receivedSupportConversation.unread_count), 1);
  const adminNotifications = await request("/notifications?role=admin", {
    cookie: admin.cookie,
  });
  const supportNotification = adminNotifications.data.find(
    (notification) =>
      notification.type === "message.received" &&
      Number(notification.entity_id) === Number(supportConversation.data.id),
  );
  assert(supportNotification);
  assert.equal(supportNotification.link, "/admin/contact-requests");

  await request(`/cart/${createdProduct.data.id}`, {
    method: "PUT",
    cookie: buyer.cookie,
    body: { quantity: 2 },
  });
  const cartBeforeOrder = await request("/cart", { cookie: buyer.cookie });
  assert.equal(cartBeforeOrder.data.length, 1);
  assert.equal(cartBeforeOrder.data[0].seller_name, "Boutique Smoke VinnHT");
  assert.equal(Number(cartBeforeOrder.data[0].quantity), 2);

  const order = await request("/orders", {
    method: "POST",
    cookie: buyer.cookie,
    body: {
      items: [{ productId: createdProduct.data.id, quantity: 2 }],
      deliveryAddress: "Pétion-Ville, rue de la validation numéro 10",
    },
  });
  assert.equal(order.data.total, 5000);
  assert.equal(order.data.paymentInstructions.length, 1);
  const cartAfterOrder = await request("/cart", { cookie: buyer.cookie });
  assert.equal(cartAfterOrder.data.length, 0);

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=",
    "base64",
  );
  const proofForm = new FormData();
  proofForm.append("paymentProof", new Blob([png], { type: "image/png" }), "preuve.png");
  proofForm.append("note", "Preuve de simulation VinnHT");
  const proof = await request(`/payments/${order.data.id}/direct-proof`, {
    method: "PATCH",
    cookie: buyer.cookie,
    body: proofForm,
  });
  paymentProofPath = proof.data.proofUrl;

  const sellerOrders = await request("/seller/orders", { cookie: seller.cookie });
  const sale = sellerOrders.data.find(
    (item) => Number(item.order_id) === Number(order.data.id),
  );
  assert(sale, "La vente vendeur n'a pas été créée.");

  await request(`/seller/sales/${sale.sale_id}/payment/validate`, {
    method: "PATCH",
    cookie: seller.cookie,
  });
  await request(`/seller/sales/${sale.sale_id}/status`, {
    method: "PATCH",
    cookie: seller.cookie,
    body: { status: "preparing" },
  });
  await request(`/seller/sales/${sale.sale_id}/status`, {
    method: "PATCH",
    cookie: seller.cookie,
    body: { status: "ready" },
  });
  await request(`/seller/sales/${sale.sale_id}/assign-driver`, {
    method: "PATCH",
    cookie: seller.cookie,
    body: { deliveryUserId: driverUser.id },
  });

  const driver = await login(driverEmail);
  const missions = await request("/deliveries/mine", { cookie: driver.cookie });
  const mission = missions.data.find(
    (item) => Number(String(item.id).replace("seller-", "")) > 0 &&
      item.order_number === order.data.orderNumber,
  );
  assert(mission, "La mission livreur n'a pas été créée.");

  await request(`/deliveries/${mission.id}/status`, {
    method: "PATCH",
    cookie: driver.cookie,
    body: { status: "picked_up" },
  });
  await request(`/deliveries/${mission.id}/status`, {
    method: "PATCH",
    cookie: driver.cookie,
    body: { status: "in_transit" },
  });
  await request(`/deliveries/${mission.id}/status`, {
    method: "PATCH",
    cookie: driver.cookie,
    body: {
      status: "delivered",
      signerName: "Client Smoke",
      signatureData: `data:image/png;base64,${png.toString("base64")}`,
      notes: "Commande reçue en bon état.",
    },
  });

  const orderDetail = await request(`/orders/${order.data.id}`, {
    cookie: buyer.cookie,
  });
  assert.equal(orderDetail.data.status, "delivered");
  assert.equal(orderDetail.data.payment_status, "paid");
  assert.equal(orderDetail.data.deliveryPeople.length, 1);
  assert.equal(orderDetail.data.deliveryPeople[0].delivery_name, "Livreur Smoke");
  assert(orderDetail.data.deliveryPeople[0].delivery_profile_image_url);

  const [[productAfterOrder]] = await database.query(
    "SELECT stock FROM products WHERE id=?",
    [createdProduct.data.id],
  );
  assert.equal(productAfterOrder.stock, 3);

  const report = await request("/admin/reports?range=7d", {
    cookie: manager.cookie,
  });
  assert.equal(Number(report.data.stats.orders), 1);

  console.log("✓ Demande vendeur approuvée");
  console.log("✓ Détection de session anonyme sans erreur 401");
  console.log("✓ Boutique et produit créés");
  console.log("✓ Panier, commande et stock validés");
  console.log("✓ Message support client reçu et notifié côté admin");
  console.log("✓ Téléphone et identité du formulaire Contact visibles côté admin");
  console.log("✓ Preuve MonCash validée par le vendeur");
  console.log("✓ Préparation et assignation au livreur validées");
  console.log("✓ Signature et livraison finale validées");
  console.log("✓ Photo du livreur visible côté client");
  console.log("✓ Rapport manager mis à jour");
};

try {
  await createTemporaryDatabase();
  await startTemporaryServer();
  await runFlow();
  console.log("\nSimulation marketplace VinnHT réussie.");
} finally {
  if (server && !server.killed) {
    server.kill();
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  if (paymentProofPath?.startsWith("/uploads/")) {
    await fs
      .unlink(path.join(backendDirectory, paymentProofPath.replace(/^\//, "")))
      .catch(() => {});
  }
  if (database) await database.end().catch(() => {});
  const root = await mysql.createConnection(rootConnectionOptions).catch(() => null);
  if (root) {
    await root.query(`DROP DATABASE IF EXISTS \`${databaseName}\``).catch(() => {});
    await root.end();
  }
}
