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
let serverError = "";
let serverOutput = "";
const paymentProofPaths = [];

const rootConnectionOptions = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
};

const waitForApi = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${apiOrigin}/health`);
      if (response.ok) return;
    } catch {
      // Le serveur démarre encore.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const diagnostics = [serverError.trim(), serverOutput.trim()]
    .filter(Boolean)
    .join("\n");
  throw new Error(
    `Le serveur de simulation n'a pas démarré.${
      diagnostics ? `\n${diagnostics}` : ""
    }`,
  );
};

const request = async (
  route,
  { method = "GET", cookie, body, expectedStatus = null } = {},
) => {
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

  if (expectedStatus !== null) {
    assert.equal(response.status, expectedStatus);
    return { data, cookie: response.headers.get("set-cookie")?.split(";")[0] };
  }

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
    body: {
      name,
      email,
      phone,
      password,
      activityStatus: "other",
      activityDetails: "Compte de simulation VinnHT",
      termsAccepted: true,
      termsVersion: "2026-06-28-v5",
    },
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
      PAYMENT_MODEL: "protected_vinnht",
      VINNHT_MONCASH_NUMBER: "37000000",
      VINNHT_MONCASH_ACCOUNT_NAME: "VinnHT Smoke",
      JWT_SECRET: "vinnht-smoke-secret-only-for-local-validation",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverError = "";
  serverOutput = "";
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
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
  const supportEmail = `smoke.support.${suffix}@vinnht.test`;
  const financeEmail = `smoke.finance.${suffix}@vinnht.test`;
  const sellerEmail = `smoke.seller.${suffix}@vinnht.test`;
  const secondSellerEmail = `smoke.seller.second.${suffix}@vinnht.test`;
  const buyerEmail = `smoke.buyer.${suffix}@vinnht.test`;
  const driverEmail = `smoke.driver.${suffix}@vinnht.test`;
  const secondDriverEmail = `smoke.driver.second.${suffix}@vinnht.test`;
  const managerHash = await bcrypt.hash(password, 12);

  const anonymousSession = await request("/auth/me");
  assert.equal(anonymousSession.data.user, null);
  const legalTerms = await request("/legal/terms");
  assert.equal(legalTerms.data.version, "2026-06-28-v5");
  assert(legalTerms.data.sections.length >= 20);

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
  const admin = await login(adminEmail);
  await request("/admin/staff", {
    method: "POST",
    cookie: admin.cookie,
    body: {
      name: "Support Smoke",
      email: supportEmail,
      phone: "37000008",
      password,
      role: "support",
    },
  });
  await request("/admin/staff", {
    method: "POST",
    cookie: admin.cookie,
    body: {
      name: "Finance Smoke",
      email: financeEmail,
      phone: "37000009",
      password,
      role: "finance",
    },
  });
  const support = await login(supportEmail);
  const finance = await login(financeEmail);
  assert(support.data.user.roles.includes("support"));
  assert(finance.data.user.roles.includes("finance"));
  const financeReport = await request("/admin/weekly-report", {
    cookie: finance.cookie,
  });
  assert(financeReport.data.totals);

  const sellerRegistration = await register({
    name: "Vendeur Smoke",
    email: sellerEmail,
    phone: "37000001",
  });
  const sellerRequest = new FormData();
  sellerRequest.append("businessName", "Boutique Smoke VinnHT");
  sellerRequest.append("moncashNumber", "37000001");
  sellerRequest.append("moncashAccountName", "Vendeur Smoke");
  sellerRequest.append("description", "Boutique temporaire pour la validation finale.");
  sellerRequest.append("termsAccepted", "true");
  sellerRequest.append("termsVersion", "2026-06-28-v5");
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

  const [secondSellerResult] = await database.query(
    `INSERT INTO users (name,email,phone,password_hash,role,status)
     VALUES (?,?,?,?,'seller','active')`,
    ["Deuxième vendeur Smoke", secondSellerEmail, "37000004", managerHash],
  );
  await database.query(
    "INSERT INTO user_roles (user_id,role) VALUES (?,'client'),(?,'seller')",
    [secondSellerResult.insertId, secondSellerResult.insertId],
  );
  await database.query(
    `INSERT INTO seller_profiles
      (seller_id,shop_name,description,whatsapp,moncash_number,moncash_account_name,
       pickup_address,opening_hours,delivery_zones,status)
     VALUES (?,?,?,?,?,?,?,?,?,'active')`,
    [
      secondSellerResult.insertId,
      "Boutique Livraison Smoke",
      "Deuxième boutique temporaire pour valider une commande mixte.",
      "37000004",
      "37000004",
      "Deuxième vendeur Smoke",
      "Pétion-Ville, Ouest",
      "Lun-Sam 9h-17h",
      "Ouest",
    ],
  );
  const secondSeller = await login(secondSellerEmail);

  const shopForm = new FormData();
  shopForm.append("shopName", "Boutique Smoke VinnHT");
  shopForm.append("category", "Électronique");
  shopForm.append("description", "Validation automatique du parcours VinnHT.");
  shopForm.append("whatsapp", "37000001");
  shopForm.append("moncashNumber", "37000001");
  shopForm.append("moncashAccountName", "Vendeur Smoke");
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
      subcategorySlug: "divers",
      productTypeSlug: "nouveautes",
      description: "Produit temporaire de validation.",
      price: 2500,
      stock: 5,
      packOptions: [
        { unitsPerPack: 3, price: 5000 },
        { unitsPerPack: 12, price: 18000 },
      ],
      attributes: {
        condition: "Neuf",
      },
      department: "Ouest",
      city: "Delmas",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    },
  });
  const productWithPacks = await request(`/products/${createdProduct.data.id}`);
  assert.deepEqual(
    productWithPacks.data.pack_options.map((option) => Number(option.units_per_pack)),
    [3, 12],
  );
  assert.equal(productWithPacks.data.subcategory_slug, "divers");
  assert.equal(productWithPacks.data.product_type_slug, "nouveautes");
  const filteredTaxonomyProducts = await request(
    "/products?category=autres&subcategory=divers&productType=nouveautes",
  );
  assert(
    filteredTaxonomyProducts.data.some(
      (product) => Number(product.id) === Number(createdProduct.data.id),
    ),
    "Le filtrage par sous-rayon et type de produit ne retourne pas le produit créé.",
  );
  const secondProduct = await request("/products", {
    method: "POST",
    cookie: secondSeller.cookie,
    body: {
      name: "Produit Livraison Smoke",
      categoryId: category.id,
      description: "Produit temporaire de la deuxième boutique.",
      price: 1800,
      stock: 4,
      attributes: {
        condition: "Neuf",
      },
      department: "Ouest",
      city: "Pétion-Ville",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
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
  assert.equal(buyer.data.user.activity_status, "other");
  const [[buyerTermsAcceptance]] = await database.query(
    `SELECT uta.terms_version,uta.accepted_at,uta.terms_snapshot
     FROM user_terms_acceptances uta
     JOIN users u ON u.id=uta.user_id
     WHERE u.email=?`,
    [buyerEmail],
  );
  assert.equal(buyerTermsAcceptance.terms_version, "2026-06-28-v5");
  assert(buyerTermsAcceptance.accepted_at);
  assert(buyerTermsAcceptance.terms_snapshot);
  const followed = await request(`/shops/${seller.data.user.id}/follow`, {
    method: "POST",
    cookie: buyer.cookie,
  });
  assert.equal(followed.data.following, true);
  assert.equal(followed.data.followerCount, 1);
  const followState = await request(`/shops/${seller.data.user.id}/follow`, {
    cookie: buyer.cookie,
  });
  assert.equal(followState.data.following, true);

  const followedProduct = await request("/products", {
    method: "POST",
    cookie: seller.cookie,
    body: {
      name: "Nouveauté boutique suivie Smoke",
      categoryId: category.id,
      description: "Produit temporaire pour valider les notifications d’abonnement.",
      price: 2100,
      stock: 3,
      attributes: { condition: "Neuf" },
      department: "Ouest",
      city: "Delmas",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    },
  });
  await request(`/seller/products/${followedProduct.data.id}`, {
    method: "PATCH",
    cookie: seller.cookie,
    body: {
      isFeatured: true,
      promotionalPrice: 1700,
      offerEndsAt: new Date(Date.now() + 86_400_000).toISOString(),
    },
  });
  const followerNotifications = await request("/notifications?role=client", {
    cookie: buyer.cookie,
  });
  assert(
    followerNotifications.data.some(
      (notification) =>
        notification.type === "shop.new_product" &&
        Number(notification.entity_id) === Number(followedProduct.data.id),
    ),
  );
  assert(
    followerNotifications.data.some(
      (notification) =>
        notification.type === "shop.special_offer" &&
        Number(notification.entity_id) === Number(followedProduct.data.id),
    ),
  );
  const supportConversation = await request("/messages/support", {
    method: "POST",
    cookie: buyer.cookie,
  });
  await request(`/messages/conversations/${supportConversation.data.id}`, {
    method: "POST",
    cookie: buyer.cookie,
    body: { body: "Bonjour Support VinnHT, ceci est un test." },
  });
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
    cookie: support.cookie,
  });
  const publicContact = supportRequests.data.find(
    (item) => item.name === "Contact Public Smoke",
  );
  assert(publicContact);
  assert.equal(publicContact.phone, "38000009");
  assert.equal(publicContact.subject, "Question avant achat");

  const adminConversations = await request("/messages/conversations", {
    cookie: support.cookie,
  });
  const receivedSupportConversation = adminConversations.data.find(
    (conversation) => Number(conversation.id) === Number(supportConversation.data.id),
  );
  assert(receivedSupportConversation);
  assert.equal(receivedSupportConversation.name, "Client Smoke");
  assert.equal(Number(receivedSupportConversation.unread_count), 1);
  const adminNotifications = await request("/notifications?role=support", {
    cookie: support.cookie,
  });
  const supportNotification = adminNotifications.data.find(
    (notification) =>
      notification.type === "message.received" &&
      Number(notification.entity_id) === Number(supportConversation.data.id),
  );
  assert(supportNotification);
  assert.equal(supportNotification.link, "/support");

  await request(`/cart/${createdProduct.data.id}`, {
    method: "PUT",
    cookie: buyer.cookie,
    body: { quantity: 1, packSize: 3 },
  });
  const cartBeforeOrder = await request("/cart", { cookie: buyer.cookie });
  assert.equal(cartBeforeOrder.data.length, 1);
  assert.equal(cartBeforeOrder.data[0].seller_name, "Boutique Smoke VinnHT");
  assert.equal(Number(cartBeforeOrder.data[0].quantity), 1);
  assert.equal(Number(cartBeforeOrder.data[0].pack_size), 3);
  assert.equal(Number(cartBeforeOrder.data[0].units_total), 3);
  assert.equal(Number(cartBeforeOrder.data[0].price), 5000);

  const order = await request("/orders", {
    method: "POST",
    cookie: buyer.cookie,
    body: {
      items: [{ productId: createdProduct.data.id, quantity: 1, packSize: 3 }],
      fulfillmentMethod: "delivery",
      deliveryAddress: "Pétion-Ville, rue de la validation numéro 10",
    },
  });
  assert.equal(order.data.total, 5500);
  assert.equal(order.data.deliveryFee, 500);
  assert.equal(order.data.fulfillmentMethod, "delivery");
  assert.equal(order.data.paymentInstructions.length, 1);
  assert.equal(order.data.paymentAccount.moncashNumber, "37000000");
  assert.equal(order.data.paymentInstructions[0].moncash_number, "37000000");
  assert.equal(Number(order.data.paymentInstructions[0].delivery_fee), 500);
  assert.equal(Number(order.data.paymentInstructions[0].amount), 5500);
  const cartAfterOrder = await request("/cart", { cookie: buyer.cookie });
  assert.equal(cartAfterOrder.data.length, 0);
  const packedOrderDetail = await request(`/orders/${order.data.id}`, {
    cookie: buyer.cookie,
  });
  assert.equal(Number(packedOrderDetail.data.items[0].pack_size), 3);
  assert.equal(Number(packedOrderDetail.data.items[0].quantity), 1);
  assert.equal(Number(packedOrderDetail.data.items[0].units_total), 3);

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=",
    "base64",
  );
  const proofForm = new FormData();
  proofForm.append("paymentProof", new Blob([png], { type: "image/png" }), "preuve.png");
  proofForm.append("note", "Preuve de simulation VinnHT");
  const proof = await request(`/payments/${order.data.id}/proof`, {
    method: "PATCH",
    cookie: buyer.cookie,
    body: proofForm,
  });
  paymentProofPaths.push(proof.data.proofUrl);

  const sellerOrders = await request("/seller/orders", { cookie: seller.cookie });
  const sale = sellerOrders.data.find(
    (item) => Number(item.order_id) === Number(order.data.id),
  );
  assert(sale, "La vente vendeur n'a pas été créée.");

  await request(`/admin/payments/${order.data.id}/validate`, {
    method: "PATCH",
    cookie: admin.cookie,
  });
  const sellerNotifications = await request("/notifications?role=seller", {
    cookie: seller.cookie,
  });
  assert(
    sellerNotifications.data.some(
      (notification) =>
        notification.type === "order.paid" &&
        Number(notification.entity_id) === Number(order.data.id),
    ),
    "Le vendeur n'a pas reçu la notification de commande payée.",
  );
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
  assert.equal(orderDetail.data.status, "shipped");
  assert.equal(orderDetail.data.payment_status, "paid");
  assert.equal(orderDetail.data.deliveryPeople.length, 1);
  assert.equal(orderDetail.data.deliveryPeople[0].delivery_name, "Livreur Smoke");
  assert(orderDetail.data.deliveryPeople[0].delivery_profile_image_url);
  assert.equal(orderDetail.data.deliveryPeople[0].client_confirmed_at, null);

  await request(
    `/orders/${order.data.id}/deliveries/${mission.id}/confirm-receipt`,
    {
      method: "PATCH",
      cookie: buyer.cookie,
      body: { signatureAcknowledged: true },
    },
  );

  const confirmedOrderDetail = await request(`/orders/${order.data.id}`, {
    cookie: buyer.cookie,
  });
  assert.equal(confirmedOrderDetail.data.status, "delivered");
  assert(confirmedOrderDetail.data.deliveryPeople[0].client_confirmed_at);

  const payoutsAfterDelivery = await request("/admin/payouts", {
    cookie: admin.cookie,
  });
  const deliveryPayout = payoutsAfterDelivery.data.find(
    (payout) => Number(payout.order_id) === Number(order.data.id),
  );
  assert(deliveryPayout);
  assert.equal(deliveryPayout.status, "processing");
  const protectedPayoutBypass = await request(`/admin/payouts/${deliveryPayout.id}/paid`, {
    method: "PATCH",
    cookie: admin.cookie,
    body: { reference: "MONCASH-SMOKE-DELIVERY" },
    expectedStatus: 409,
  });
  assert.match(protectedPayoutBypass.data.message, /demande vendeur approuvée/i);

  const [[productAfterOrder]] = await database.query(
    "SELECT stock FROM products WHERE id=?",
    [createdProduct.data.id],
  );
  assert.equal(productAfterOrder.stock, 2);

  await request(`/cart/${createdProduct.data.id}`, {
    method: "PUT",
    cookie: buyer.cookie,
    body: { quantity: 1 },
  });
  const pickupOrder = await request("/orders", {
    method: "POST",
    cookie: buyer.cookie,
    body: {
      items: [{ productId: createdProduct.data.id, quantity: 1 }],
      fulfillmentMethod: "pickup",
    },
  });
  assert.equal(pickupOrder.data.total, 2500);
  assert.equal(pickupOrder.data.deliveryFee, 0);
  assert.equal(pickupOrder.data.fulfillmentMethod, "pickup");
  assert.equal(
    pickupOrder.data.paymentInstructions[0].pickup_address,
    "Delmas 33, Port-au-Prince",
  );

  const pickupProofForm = new FormData();
  pickupProofForm.append(
    "paymentProof",
    new Blob([png], { type: "image/png" }),
    "preuve-retrait.png",
  );
  pickupProofForm.append("note", "Paiement du retrait VinnHT");
  const pickupProof = await request(
    `/payments/${pickupOrder.data.id}/proof`,
    {
      method: "PATCH",
      cookie: buyer.cookie,
      body: pickupProofForm,
    },
  );
  paymentProofPaths.push(pickupProof.data.proofUrl);

  const pickupSellerOrders = await request("/seller/orders", { cookie: seller.cookie });
  const pickupSale = pickupSellerOrders.data.find(
    (item) => Number(item.order_id) === Number(pickupOrder.data.id),
  );
  assert(pickupSale);
  assert.equal(pickupSale.fulfillment_method, "pickup");
  await request(`/admin/payments/${pickupOrder.data.id}/validate`, {
    method: "PATCH",
    cookie: admin.cookie,
  });
  await request(`/seller/sales/${pickupSale.sale_id}/status`, {
    method: "PATCH",
    cookie: seller.cookie,
    body: { status: "preparing" },
  });
  await request(`/seller/sales/${pickupSale.sale_id}/status`, {
    method: "PATCH",
    cookie: seller.cookie,
    body: { status: "ready" },
  });
  await request(`/seller/sales/${pickupSale.sale_id}/pickup/handover`, {
    method: "PATCH",
    cookie: seller.cookie,
  });

  const pickupDetailBeforeConfirmation = await request(
    `/orders/${pickupOrder.data.id}`,
    { cookie: buyer.cookie },
  );
  assert(pickupDetailBeforeConfirmation.data.paymentInstructions[0].pickup_handed_over_at);
  assert.equal(
    pickupDetailBeforeConfirmation.data.paymentInstructions[0].pickup_client_confirmed_at,
    null,
  );
  await request(
    `/orders/${pickupOrder.data.id}/pickups/${pickupSale.sale_id}/confirm-receipt`,
    {
      method: "PATCH",
      cookie: buyer.cookie,
      body: { receiptAcknowledged: true },
    },
  );
  const confirmedPickupOrder = await request(`/orders/${pickupOrder.data.id}`, {
    cookie: buyer.cookie,
  });
  assert.equal(confirmedPickupOrder.data.status, "delivered");
  assert(confirmedPickupOrder.data.paymentInstructions[0].pickup_client_confirmed_at);
  const payoutsAfterPickup = await request("/admin/payouts", {
    cookie: admin.cookie,
  });
  const pickupPayout = payoutsAfterPickup.data.find(
    (payout) => Number(payout.order_id) === Number(pickupOrder.data.id),
  );
  assert(pickupPayout);
  assert.equal(pickupPayout.status, "processing");

  await request(`/cart/${createdProduct.data.id}`, {
    method: "PUT",
    cookie: buyer.cookie,
    body: { quantity: 1 },
  });
  await request(`/cart/${secondProduct.data.id}`, {
    method: "PUT",
    cookie: buyer.cookie,
    body: { quantity: 1 },
  });
  const blockedDelivery = await request("/orders", {
    method: "POST",
    cookie: buyer.cookie,
    expectedStatus: 409,
    body: {
      items: [{ productId: secondProduct.data.id, quantity: 1 }],
      fulfillmentChoices: [
        { sellerId: secondSeller.data.user.id, method: "delivery" },
      ],
      deliveryAddress: "Delmas 75, Port-au-Prince, Ouest",
    },
  });
  assert.match(blockedDelivery.data.message, /aucun livreur actif/i);

  await request("/seller/delivery-drivers", {
    method: "POST",
    cookie: secondSeller.cookie,
    body: {
      name: "Deuxième livreur Smoke",
      email: secondDriverEmail,
      phone: "37000005",
      password,
      zones: "Ouest",
      vehicleType: "Moto",
    },
  });

  const mixedOrder = await request("/orders", {
    method: "POST",
    cookie: buyer.cookie,
    body: {
      items: [
        { productId: createdProduct.data.id, quantity: 1 },
        { productId: secondProduct.data.id, quantity: 1 },
      ],
      fulfillmentChoices: [
        { sellerId: seller.data.user.id, method: "pickup" },
        { sellerId: secondSeller.data.user.id, method: "delivery" },
      ],
      deliveryAddress: "Delmas 75, Port-au-Prince, Ouest",
    },
  });
  assert.equal(mixedOrder.data.fulfillmentMethod, "mixed");
  assert.equal(mixedOrder.data.deliveryFee, 500);
  assert.equal(mixedOrder.data.total, 4800);
  assert.equal(mixedOrder.data.paymentInstructions.length, 2);
  const mixedPickupInstruction = mixedOrder.data.paymentInstructions.find(
    (instruction) => instruction.fulfillment_method === "pickup",
  );
  const mixedDeliveryInstruction = mixedOrder.data.paymentInstructions.find(
    (instruction) => instruction.fulfillment_method === "delivery",
  );
  assert(mixedPickupInstruction);
  assert(mixedDeliveryInstruction);
  assert.equal(Number(mixedPickupInstruction.delivery_fee), 0);
  assert.equal(Number(mixedDeliveryInstruction.delivery_fee), 500);
  assert.equal(mixedDeliveryInstruction.delivery_address, "Delmas 75, Port-au-Prince, Ouest");

  const report = await request("/admin/reports?range=7d", {
    cookie: manager.cookie,
  });
  assert.equal(Number(report.data.stats.orders), 3);

  console.log("✓ Demande vendeur approuvée");
  console.log("✓ Détection de session anonyme sans erreur 401");
  console.log("✓ Boutique et produit créés");
  console.log("✓ Suivi boutique et alertes nouveaux produits/offres validés");
  console.log("✓ Panier, commande et stock validés");
  console.log("✓ Vente optionnelle par lots 3/6/12/24 validée");
  console.log("✓ Message support client reçu et notifié côté admin");
  console.log("✓ Téléphone et identité du formulaire Contact visibles côté admin");
  console.log("✓ Preuve MonCash validée uniquement par l’admin VinnHT");
  console.log("✓ Préparation et assignation au livreur validées");
  console.log("✓ Signature et livraison finale validées");
  console.log("✓ Retrait gratuit et double confirmation validés");
  console.log("✓ Fonds vendeur bloqués, libérés puis versés après réception");
  console.log("✓ Retrait et livraison combinés dans une même commande");
  console.log("✓ Livraison bloquée sans livreur propre à la boutique");
  console.log("✓ Photo du livreur visible côté client");
  console.log("✓ Rapport manager mis à jour");
};

try {
  await createTemporaryDatabase();
  await startTemporaryServer();
  await runFlow();
  console.log("\nSimulation marketplace VinnHT réussie.");
} catch (error) {
  if (serverError) console.error(serverError);
  throw error;
} finally {
  if (server && !server.killed) {
    server.kill();
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  for (const paymentProofPath of paymentProofPaths) {
    if (!paymentProofPath?.startsWith("/uploads/")) continue;
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
