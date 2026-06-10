import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import { body, validationResult } from "express-validator";
import { fileURLToPath } from "node:url";
import pool from "./config/database.js";
import { authenticate } from "./middleware/authMiddleware.js";
import { authorize } from "./middleware/roleMiddleware.js";
import {
  uploadProductImages,
  uploadProfileImage,
  uploadSellerImages,
} from "./middleware/uploadMiddleware.js";
import { generateToken } from "./utils/generateToken.js";

const app = express();
const backendDirectory = fileURLToPath(new URL("../", import.meta.url));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(`${backendDirectory}/uploads`));

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res
      .status(422)
      .json({ message: "Données invalides.", errors: errors.array() });
  next();
};
const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
const getUserRoles = async (userId, fallbackRole = "client") => {
  const [rows] = await pool.query(
    "SELECT role FROM user_roles WHERE user_id=? ORDER BY role",
    [userId],
  );
  return rows.length ? rows.map((row) => row.role) : [fallbackRole];
};
const safeUserWithRoles = async (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  profile_image_url: user.profile_image_url,
  role: user.role,
  roles: await getUserRoles(user.id, user.role),
});
const slugify = (text) =>
  `${text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${Date.now()}`;

app.get("/", (_req, res) => {
  res.json({
    name: "VinnHT API",
    slogan: "Le marché numérique d'Haïti",
    status: "running",
    docs: {
      health: "/api/health",
      auth: "/api/auth/register, /api/auth/login",
      products: "/api/products",
      categories: "/api/categories",
    },
  });
});

app.get("/api", (_req, res) => {
  res.json({
    name: "VinnHT API",
    message:
      "API disponible. Utilisez /api/health pour tester la connexion MySQL.",
  });
});

app.get(
  "/api/health",
  asyncRoute(async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok", name: "VinnHT API" });
  }),
);

app.post(
  "/api/auth/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("Le nom doit contenir entre 2 et 120 caractères."),
    body("email")
      .isEmail()
      .withMessage("L’adresse email est invalide.")
      .normalizeEmail(),
    body("phone")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 8, max: 30 })
      .withMessage("Le numéro de téléphone est invalide."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Le mot de passe doit contenir au moins 8 caractères."),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const { name, email, phone, password } = req.body;
    const [[existing]] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existing)
      return res
        .status(409)
        .json({ message: "Cette adresse email est déjà utilisée." });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      "INSERT INTO users (name,email,phone,password_hash) VALUES (?,?,?,?)",
      [name, email, phone || null, hash],
    );
    await pool.query("INSERT IGNORE INTO user_roles (user_id,role) VALUES (?,'client')", [
      result.insertId,
    ]);
    const user = {
      id: result.insertId,
      name,
      email,
      phone: phone || null,
      role: "client",
      roles: ["client"],
    };
    res.status(201).json({ user, token: generateToken(user) });
  }),
);

app.post(
  "/api/auth/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  asyncRoute(async (req, res) => {
    const [[user]] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND status = 'active'",
      [req.body.email],
    );
    if (!user || !(await bcrypt.compare(req.body.password, user.password_hash)))
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect." });
    const safeUser = await safeUserWithRoles(user);
    res.json({ user: safeUser, token: generateToken(safeUser) });
  }),
);
app.get(
  "/api/auth/me",
  authenticate,
  asyncRoute(async (req, res) => {
    const [[user]] = await pool.query(
      "SELECT id,name,email,phone,profile_image_url,role,status,created_at FROM users WHERE id = ?",
      [req.user.id],
    );
    res.json(await safeUserWithRoles(user));
  }),
);
app.patch(
  "/api/auth/profile",
  authenticate,
  uploadProfileImage,
  [
    body("name").optional().trim().isLength({ min: 2, max: 120 }),
    body("phone").optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 30 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const profileImageUrl = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : undefined;
    await pool.query(
      `UPDATE users
       SET name=COALESCE(?,name),
           phone=COALESCE(?,phone),
           profile_image_url=COALESCE(?,profile_image_url)
       WHERE id=?`,
      [req.body.name || null, req.body.phone || null, profileImageUrl || null, req.user.id],
    );
    const [[user]] = await pool.query(
      "SELECT id,name,email,phone,profile_image_url,role,status,created_at FROM users WHERE id=?",
      [req.user.id],
    );
    res.json({ message: "Profil mis à jour.", user: await safeUserWithRoles(user) });
  }),
);
app.delete(
  "/api/auth/profile/photo",
  authenticate,
  asyncRoute(async (req, res) => {
    await pool.query("UPDATE users SET profile_image_url=NULL WHERE id=?", [req.user.id]);
    const [[user]] = await pool.query(
      "SELECT id,name,email,phone,profile_image_url,role,status,created_at FROM users WHERE id=?",
      [req.user.id],
    );
    res.json({ message: "Photo de profil supprimée.", user: await safeUserWithRoles(user) });
  }),
);

app.get(
  "/api/categories",
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query("SELECT * FROM categories ORDER BY name");
    res.json(rows);
  }),
);
app.get(
  "/api/products",
  asyncRoute(async (req, res) => {
    const params = [];
    let where = "WHERE p.status = 'active'";
    if (req.query.category) {
      where += " AND c.slug = ?";
      params.push(req.query.category);
    }
    if (req.query.search) {
      where += " AND (p.name LIKE ? OR p.description LIKE ? OR u.name LIKE ? OR c.name LIKE ?)";
      params.push(
        `%${req.query.search}%`,
        `%${req.query.search}%`,
        `%${req.query.search}%`,
        `%${req.query.search}%`,
      );
    }
    if (req.query.seller) {
      where += " AND p.seller_id = ?";
      params.push(req.query.seller);
    }
    const [rows] = await pool.query(
      `SELECT p.*, c.name category_name, u.name seller_name FROM products p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.seller_id ${where} ORDER BY p.created_at DESC`,
      params,
    );
    res.json(rows);
  }),
);
app.get(
  "/api/shops",
  asyncRoute(async (_req, res) => {
    const [shops] = await pool.query(
      `SELECT u.id seller_id,COALESCE(sp.shop_name,u.name) shop_name,
        sp.shop_logo_url,
        sp.category,sp.description,
        (SELECT COUNT(*) FROM products WHERE seller_id=u.id AND status='active') product_count,
        COALESCE((SELECT ROUND(AVG(sr.rating),1) FROM shop_reviews sr WHERE sr.seller_id=u.id),0) rating,
        (SELECT COUNT(*) FROM shop_reviews sr WHERE sr.seller_id=u.id) review_count
       FROM users u
       JOIN user_roles ur ON ur.user_id=u.id AND ur.role='seller'
       LEFT JOIN seller_profiles sp ON sp.seller_id=u.id
       WHERE u.status='active'
       ORDER BY product_count DESC,shop_name`,
    );
    res.json(shops);
  }),
);
app.get(
  "/api/shops/:sellerId",
  asyncRoute(async (req, res) => {
    const [[shop]] = await pool.query(
      `SELECT u.id seller_id,u.name owner_name,u.profile_image_url,
        COALESCE(sp.shop_name,u.name) shop_name,sp.shop_logo_url,sp.category,sp.description,
        sp.whatsapp,sp.pickup_address,
        COALESCE((SELECT ROUND(AVG(sr.rating),1) FROM shop_reviews sr WHERE sr.seller_id=u.id),0) rating,
        (SELECT COUNT(*) FROM shop_reviews sr WHERE sr.seller_id=u.id) review_count
       FROM users u
       JOIN user_roles ur ON ur.user_id=u.id AND ur.role='seller'
       LEFT JOIN seller_profiles sp ON sp.seller_id=u.id
       WHERE u.id=? AND u.status='active'`,
      [req.params.sellerId],
    );
    if (!shop) return res.status(404).json({ message: "Boutique introuvable." });
    res.json(shop);
  }),
);
app.get(
  "/api/shops/:sellerId/reviews",
  asyncRoute(async (req, res) => {
    const [reviews] = await pool.query(
      `SELECT sr.id,sr.rating,sr.comment,sr.created_at,u.name client_name,u.profile_image_url
       FROM shop_reviews sr
       JOIN users u ON u.id=sr.client_id
       WHERE sr.seller_id=?
       ORDER BY sr.created_at DESC`,
      [req.params.sellerId],
    );
    res.json(reviews);
  }),
);
app.post(
  "/api/shops/:sellerId/reviews",
  authenticate,
  authorize("client"),
  [
    body("orderId").isInt({ min: 1 }),
    body("rating").isInt({ min: 1, max: 5 }),
    body("comment").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const [[eligibleOrder]] = await pool.query(
      `SELECT o.id
       FROM orders o
       JOIN order_items oi ON oi.order_id=o.id
       WHERE o.id=? AND o.client_id=? AND o.status='delivered' AND oi.seller_id=?
       LIMIT 1`,
      [req.body.orderId, req.user.id, req.params.sellerId],
    );

    if (!eligibleOrder) {
      return res.status(403).json({
        message: "Vous pouvez noter cette boutique après la livraison d'une commande vérifiée.",
      });
    }

    await pool.query(
      `INSERT INTO shop_reviews (client_id,seller_id,order_id,rating,comment)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE rating=VALUES(rating),comment=VALUES(comment)`,
      [
        req.user.id,
        req.params.sellerId,
        req.body.orderId,
        req.body.rating,
        req.body.comment || null,
      ],
    );

    res.status(201).json({ message: "Votre avis vérifié a été enregistré." });
  }),
);
app.get(
  "/api/products/:id",
  asyncRoute(async (req, res) => {
    const [[product]] = await pool.query(
      `SELECT p.*,c.name category_name,c.slug category_slug,u.name seller_name,u.profile_image_url seller_profile_image_url,
        COALESCE(sp.shop_name,u.name) shop_name,sp.shop_logo_url
       FROM products p
       JOIN categories c ON c.id=p.category_id
       JOIN users u ON u.id=p.seller_id
       LEFT JOIN seller_profiles sp ON sp.seller_id=p.seller_id
       WHERE p.id=?`,
      [req.params.id],
    );
    if (!product)
      return res.status(404).json({ message: "Produit introuvable." });
    const [images] = await pool.query(
      "SELECT id,image_url,position FROM product_images WHERE product_id=? ORDER BY position,id",
      [product.id],
    );
    res.json({ ...product, images });
  }),
);
app.post(
  "/api/products",
  authenticate,
  authorize("seller"),
  uploadProductImages,
  [
    body("name").trim().isLength({ min: 2 }),
    body("categoryId").isInt(),
    body("price").isFloat({ min: 0 }),
    body("stock").isInt({ min: 0 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const { name, categoryId, description, price, stock, imageUrl } = req.body;
    const uploadedImages = (req.files || []).map(
      (file) => `/uploads/products/${file.filename}`,
    );
    const primaryImage = uploadedImages[0] || imageUrl || null;
    const [result] = await pool.query(
      "INSERT INTO products (seller_id,category_id,name,slug,description,price,stock,image_url) VALUES (?,?,?,?,?,?,?,?)",
      [
        req.user.id,
        categoryId,
        name,
        slugify(name),
        description || null,
        price,
        stock,
        primaryImage,
      ],
    );
    for (const [position, imageUrl] of uploadedImages.entries()) {
      await pool.query(
        "INSERT INTO product_images (product_id,image_url,position) VALUES (?,?,?)",
        [result.insertId, imageUrl, position],
      );
    }
    res.status(201).json({ id: result.insertId, message: "Produit créé." });
  }),
);
app.get(
  "/api/seller/products",
  authenticate,
  authorize("seller"),
  asyncRoute(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT p.*,c.name category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.seller_id=? ORDER BY p.created_at DESC",
      [req.user.id],
    );
    res.json(rows);
  }),
);

app.post(
  "/api/seller/requests",
  authenticate,
  authorize("client"),
  uploadSellerImages,
  [
    body("businessName").trim().isLength({ min: 2 }),
    body("description").optional().trim().isLength({ max: 10000 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const [[pending]] = await pool.query(
      "SELECT id FROM seller_requests WHERE user_id=? AND status='pending'",
      [req.user.id],
    );
    if (pending)
      return res
        .status(409)
        .json({ message: "Une demande est déjà en attente." });
    const profileFile = req.files?.profilePhoto?.[0];
    const shopLogoFile = req.files?.shopLogo?.[0];
    const profileImageUrl = profileFile
      ? `/uploads/profiles/${profileFile.filename}`
      : null;
    const shopLogoUrl = shopLogoFile ? `/uploads/shops/${shopLogoFile.filename}` : null;
    if (profileImageUrl) {
      await pool.query("UPDATE users SET profile_image_url=? WHERE id=?", [
        profileImageUrl,
        req.user.id,
      ]);
    }
    await pool.query(
      "INSERT INTO seller_requests (user_id,business_name,shop_logo_url,description) VALUES (?,?,?,?)",
      [req.user.id, req.body.businessName, shopLogoUrl, req.body.description || null],
    );
    res.status(201).json({ message: "Demande envoyée." });
  }),
);
app.get(
  "/api/seller/requests/mine",
  authenticate,
  authorize("client"),
  asyncRoute(async (req, res) => {
    const [[request]] = await pool.query(
      "SELECT * FROM seller_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 1",
      [req.user.id],
    );
    res.json(request || null);
  }),
);
app.get(
  "/api/seller/dashboard",
  authenticate,
  authorize("seller"),
  asyncRoute(async (req, res) => {
    const [[stats]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM products WHERE seller_id=? AND status='active') active_products,
        (SELECT COUNT(*) FROM products WHERE seller_id=? AND stock<=5) low_stock_products,
        (SELECT COUNT(*) FROM seller_sales WHERE seller_id=? AND status IN ('confirmed','preparing','ready','completed')) orders,
        (SELECT COUNT(*) FROM seller_sales WHERE seller_id=? AND status='confirmed') awaiting_preparation,
        (SELECT COUNT(*) FROM seller_sales WHERE seller_id=? AND status='ready') ready_orders,
        (SELECT COALESCE(SUM(gross_amount),0) FROM seller_sales WHERE seller_id=? AND status!='cancelled') gross_sales,
        (SELECT COALESCE(SUM(net_amount),0) FROM seller_sales WHERE seller_id=? AND status!='cancelled') net_sales`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id],
    );
    const [recentSales] = await pool.query(
      `SELECT ss.id,ss.net_amount,ss.status,ss.created_at,o.order_number
       FROM seller_sales ss
       JOIN orders o ON o.id=ss.order_id
       WHERE ss.seller_id=?
       ORDER BY ss.created_at DESC
       LIMIT 5`,
      [req.user.id],
    );
    res.json({ stats, recentSales });
  }),
);
app.get(
  "/api/seller/shop",
  authenticate,
  authorize("seller"),
  asyncRoute(async (req, res) => {
    const [[shop]] = await pool.query(
      `SELECT sp.*,u.name owner_name,u.email,u.phone,u.profile_image_url
       FROM users u
       LEFT JOIN seller_profiles sp ON sp.seller_id=u.id
       WHERE u.id=?`,
      [req.user.id],
    );
    res.json({
      ...shop,
      shop_name: shop.shop_name || shop.owner_name,
      whatsapp: shop.whatsapp || shop.phone,
      status: shop.status || "active",
    });
  }),
);
app.patch(
  "/api/seller/shop",
  authenticate,
  authorize("seller"),
  uploadSellerImages,
  [
    body("shopName").trim().isLength({ min: 2, max: 160 }),
    body("category").optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
    body("whatsapp").optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
    body("status").optional().isIn(["active", "paused"]),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const shopLogoFile = req.files?.shopLogo?.[0];
    const shopLogoUrl = shopLogoFile
      ? `/uploads/shops/${shopLogoFile.filename}`
      : null;
    await pool.query(
      `INSERT INTO seller_profiles
        (seller_id,shop_name,shop_logo_url,category,description,whatsapp,pickup_address,opening_hours,delivery_zones,status)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        shop_name=VALUES(shop_name),
        shop_logo_url=COALESCE(VALUES(shop_logo_url),shop_logo_url),
        category=VALUES(category),
        description=VALUES(description),
        whatsapp=VALUES(whatsapp),
        pickup_address=VALUES(pickup_address),
        opening_hours=VALUES(opening_hours),
        delivery_zones=VALUES(delivery_zones),
        status=VALUES(status)`,
      [
        req.user.id,
        req.body.shopName,
        shopLogoUrl,
        req.body.category || null,
        req.body.description || null,
        req.body.whatsapp || null,
        req.body.pickupAddress || null,
        req.body.openingHours || null,
        req.body.deliveryZones || null,
        req.body.status || "active",
      ],
    );
    const [[shop]] = await pool.query(
      "SELECT * FROM seller_profiles WHERE seller_id=?",
      [req.user.id],
    );
    res.json({ message: "Boutique mise à jour.", shop });
  }),
);
app.delete(
  "/api/seller/shop/logo",
  authenticate,
  authorize("seller"),
  asyncRoute(async (req, res) => {
    await pool.query(
      "UPDATE seller_profiles SET shop_logo_url=NULL WHERE seller_id=?",
      [req.user.id],
    );
    res.json({ message: "Logo de la boutique supprimé." });
  }),
);
app.get(
  "/api/seller/orders",
  authenticate,
  authorize("seller"),
  asyncRoute(async (req, res) => {
    const [orders] = await pool.query(
      `SELECT
        ss.id sale_id,
        ss.order_id,
        ss.gross_amount,
        ss.net_amount,
        ss.status seller_status,
        ss.created_at,
        o.order_number,
        o.status order_status,
        o.delivery_address,
        d.status delivery_status,
        u.name client_name,
        u.phone client_phone,
        p.status payment_status
      FROM seller_sales ss
      JOIN orders o ON o.id=ss.order_id
      JOIN users u ON u.id=o.client_id
      LEFT JOIN payments p ON p.order_id=o.id
      LEFT JOIN deliveries d ON d.order_id=o.id
      WHERE ss.seller_id=?
      ORDER BY ss.created_at DESC`,
      [req.user.id],
    );
    if (!orders.length) return res.json([]);
    const orderIds = orders.map((order) => order.order_id);
    const [items] = await pool.query(
      `SELECT oi.order_id,oi.product_id,oi.quantity,oi.unit_price,oi.subtotal,pr.name,pr.image_url
       FROM order_items oi
       JOIN products pr ON pr.id=oi.product_id
       WHERE oi.seller_id=? AND oi.order_id IN (${orderIds.map(() => "?").join(",")})
       ORDER BY oi.id`,
      [req.user.id, ...orderIds],
    );
    res.json(
      orders.map((order) => ({
        ...order,
        items: items.filter((item) => item.order_id === order.order_id),
      })),
    );
  }),
);
app.patch(
  "/api/seller/sales/:id/status",
  authenticate,
  authorize("seller"),
  [body("status").isIn(["preparing", "ready", "cancelled"])],
  validate,
  asyncRoute(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[sale]] = await connection.query(
        `SELECT ss.*,p.status payment_status
         FROM seller_sales ss
         LEFT JOIN payments p ON p.order_id=ss.order_id
         WHERE ss.id=? AND ss.seller_id=?
         FOR UPDATE`,
        [req.params.id, req.user.id],
      );
      if (!sale) {
        await connection.rollback();
        return res.status(404).json({ message: "Vente introuvable." });
      }
      const allowedTransitions = {
        confirmed: ["preparing", "cancelled"],
        preparing: ["ready", "cancelled"],
      };
      if (!allowedTransitions[sale.status]?.includes(req.body.status)) {
        await connection.rollback();
        return res.status(409).json({ message: "Cette vente a déjà été traitée." });
      }
      if (req.body.status !== "cancelled" && sale.payment_status !== "paid") {
        await connection.rollback();
        return res.status(409).json({
          message: "Cette commande doit être payée avant sa préparation.",
        });
      }
      await connection.query("UPDATE seller_sales SET status=? WHERE id=?", [
        req.body.status,
        sale.id,
      ]);
      if (req.body.status === "cancelled") {
        const [items] = await connection.query(
          "SELECT product_id,quantity FROM order_items WHERE order_id=? AND seller_id=?",
          [sale.order_id, req.user.id],
        );
        for (const item of items) {
          await connection.query("UPDATE products SET stock=stock+? WHERE id=?", [
            item.quantity,
            item.product_id,
          ]);
        }
        await connection.query(
          "UPDATE payouts SET status='failed' WHERE seller_sale_id=?",
          [sale.id],
        );
      } else if (req.body.status === "preparing") {
        await connection.query(
          "UPDATE orders SET status='processing' WHERE id=? AND status='confirmed'",
          [sale.order_id],
        );
      }
      await connection.commit();
      res.json({
        message:
          req.body.status === "preparing"
            ? "Préparation commencée."
            : req.body.status === "ready"
              ? "Commande prête pour la livraison."
              : "Vente annulée.",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);
app.get(
  "/api/seller/sales",
  authenticate,
  authorize("seller"),
  asyncRoute(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT ss.*,o.order_number,o.status order_status,p.status payment_status
       FROM seller_sales ss
       JOIN orders o ON o.id=ss.order_id
       LEFT JOIN payments p ON p.order_id=o.id
       WHERE ss.seller_id=?
       ORDER BY ss.created_at DESC`,
      [req.user.id],
    );
    res.json(rows);
  }),
);
app.patch(
  "/api/seller/products/:id",
  authenticate,
  authorize("seller"),
  [
    body("name").optional().trim().isLength({ min: 2 }),
    body("categoryId").optional().isInt(),
    body("price").optional().isFloat({ min: 0 }),
    body("stock").optional().isInt({ min: 0 }),
    body("status").optional().isIn(["draft", "active", "inactive"]),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const fields = [];
    const values = [];
    const mapping = {
      name: "name",
      categoryId: "category_id",
      description: "description",
      price: "price",
      stock: "stock",
      imageUrl: "image_url",
      status: "status",
    };

    for (const [input, column] of Object.entries(mapping)) {
      if (req.body[input] !== undefined) {
        fields.push(`${column}=?`);
        values.push(req.body[input]);
      }
    }
    if (!fields.length)
      return res.status(422).json({ message: "Aucune modification fournie." });

    values.push(req.params.id, req.user.id);
    const [result] = await pool.query(
      `UPDATE products SET ${fields.join(",")} WHERE id=? AND seller_id=?`,
      values,
    );
    if (!result.affectedRows)
      return res.status(404).json({ message: "Produit introuvable." });
    res.json({ message: "Produit mis Ã  jour." });
  }),
);
app.get(
  "/api/seller/payouts",
  authenticate,
  authorize("seller"),
  asyncRoute(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT po.*,ss.gross_amount,ss.commission_amount,o.order_number
       FROM payouts po
       JOIN seller_sales ss ON ss.id=po.seller_sale_id
       JOIN orders o ON o.id=ss.order_id
       WHERE po.seller_id=?
       ORDER BY po.created_at DESC`,
      [req.user.id],
    );
    res.json(rows);
  }),
);

app.post(
  "/api/orders",
  authenticate,
  authorize("client"),
  [
    body("items").isArray({ min: 1 }),
    body("deliveryAddress").trim().isLength({ min: 8 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const ids = req.body.items.map((item) => Number(item.productId));
      const [products] = await connection.query(
        `SELECT id,seller_id,price,stock FROM products WHERE status='active' AND id IN (${ids.map(() => "?").join(",")}) FOR UPDATE`,
        ids,
      );
      const byId = new Map(products.map((p) => [p.id, p]));
      let total = 0;
      const sellerTotals = new Map();
      for (const item of req.body.items) {
        const product = byId.get(Number(item.productId));
        const quantity = Number(item.quantity);
        if (!product || quantity < 1 || product.stock < quantity)
          throw Object.assign(
            new Error("Un produit est indisponible ou en stock insuffisant."),
            { status: 409 },
          );
        const subtotal = product.price * quantity;
        total += subtotal;
        sellerTotals.set(
          product.seller_id,
          (sellerTotals.get(product.seller_id) || 0) + subtotal,
        );
      }
      const orderNumber = `VHT-${Date.now()}`;
      const [order] = await connection.query(
        "INSERT INTO orders (client_id,order_number,total,delivery_address) VALUES (?,?,?,?)",
        [req.user.id, orderNumber, total, req.body.deliveryAddress],
      );
      for (const item of req.body.items) {
        const product = byId.get(Number(item.productId));
        const subtotal = product.price * Number(item.quantity);
        await connection.query(
          "INSERT INTO order_items (order_id,product_id,seller_id,quantity,unit_price,subtotal) VALUES (?,?,?,?,?,?)",
          [
            order.insertId,
            product.id,
            product.seller_id,
            item.quantity,
            product.price,
            subtotal,
          ],
        );
        await connection.query("UPDATE products SET stock=stock-? WHERE id=?", [
          item.quantity,
          product.id,
        ]);
      }
      const commissionRate = Number(process.env.COMMISSION_RATE || 0.1);
      for (const [sellerId, gross] of sellerTotals) {
        const commission = gross * commissionRate;
        const net = gross - commission;
        const [sale] = await connection.query(
          "INSERT INTO seller_sales (order_id,seller_id,gross_amount,commission_amount,net_amount) VALUES (?,?,?,?,?)",
          [order.insertId, sellerId, gross, commission, net],
        );
        await connection.query(
          "INSERT INTO payouts (seller_sale_id,seller_id,amount) VALUES (?,?,?)",
          [sale.insertId, sellerId, net],
        );
      }
      await connection.query(
        "INSERT INTO payments (order_id,amount) VALUES (?,?)",
        [order.insertId, total],
      );
      await connection.query("INSERT INTO deliveries (order_id) VALUES (?)", [
        order.insertId,
      ]);
      await connection.commit();
      res
        .status(201)
        .json({
          id: order.insertId,
          orderNumber,
          total,
          paymentStatus: "pending",
        });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);
app.get(
  "/api/orders/mine",
  authenticate,
  authorize("client"),
  asyncRoute(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT
        o.*,
        p.status payment_status,
        d.status delivery_status,
        COUNT(oi.id) item_count,
        MIN(pr.image_url) image_url,
        GROUP_CONCAT(DISTINCT seller.name ORDER BY seller.name SEPARATOR ', ') seller_names
      FROM orders o
      LEFT JOIN payments p ON p.order_id=o.id
      LEFT JOIN deliveries d ON d.order_id=o.id
      LEFT JOIN order_items oi ON oi.order_id=o.id
      LEFT JOIN products pr ON pr.id=oi.product_id
      LEFT JOIN users seller ON seller.id=oi.seller_id
      WHERE o.client_id=?
      GROUP BY o.id,p.status,d.status
      ORDER BY o.created_at DESC`,
      [req.user.id],
    );
    res.json(rows);
  }),
);

app.get(
  "/api/orders/:id",
  authenticate,
  authorize("client"),
  asyncRoute(async (req, res) => {
    const [[order]] = await pool.query(
      `SELECT
        o.*,
        p.status payment_status,
        p.provider payment_provider,
        p.reference payment_reference,
        d.status delivery_status,
        d.notes delivery_notes,
        driver.name delivery_name,
        driver.phone delivery_phone,
        driver.profile_image_url delivery_profile_image_url
      FROM orders o
      LEFT JOIN payments p ON p.order_id=o.id
      LEFT JOIN deliveries d ON d.order_id=o.id
      LEFT JOIN users driver ON driver.id=d.delivery_user_id
      WHERE o.id=? AND o.client_id=?`,
      [req.params.id, req.user.id],
    );
    if (!order)
      return res.status(404).json({ message: "Commande introuvable." });

    const [items] = await pool.query(
      `SELECT
        oi.*,
        pr.name product_name,
        pr.image_url,
        seller.name seller_name
      FROM order_items oi
      JOIN products pr ON pr.id=oi.product_id
      JOIN users seller ON seller.id=oi.seller_id
      WHERE oi.order_id=?
      ORDER BY seller.name,oi.id`,
      [order.id],
    );
    res.json({ ...order, items });
  }),
);

app.patch(
  "/api/payments/:orderId/simulate",
  authenticate,
  authorize("client"),
  [body("status").isIn(["paid", "failed"])],
  validate,
  asyncRoute(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[order]] = await connection.query(
        "SELECT id,order_number FROM orders WHERE id=? AND client_id=? FOR UPDATE",
        [req.params.orderId, req.user.id],
      );
      if (!order) {
        await connection.rollback();
        return res.status(404).json({ message: "Paiement introuvable." });
      }

      const reference =
        req.body.status === "paid" ? `SIM-${Date.now()}` : null;
      await connection.query(
        "UPDATE payments SET status=?,reference=?,paid_at=IF(?='paid',NOW(),NULL) WHERE order_id=?",
        [req.body.status, reference, req.body.status, order.id],
      );

      if (req.body.status === "paid") {
        await connection.query(
          "UPDATE orders SET status='confirmed' WHERE id=?",
          [order.id],
        );
        await connection.query(
          "UPDATE seller_sales SET status='confirmed' WHERE order_id=?",
          [order.id],
        );
      }

      await connection.commit();
      res.json({
        message:
          req.body.status === "paid"
            ? "Paiement confirmé."
            : "Le paiement simulé a échoué.",
        orderId: order.id,
        orderNumber: order.order_number,
        paymentStatus: req.body.status,
        reference,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);

app.get(
  "/api/deliveries/dashboard",
  authenticate,
  authorize("delivery"),
  asyncRoute(async (req, res) => {
    const [[stats]] = await pool.query(
      `SELECT
        COUNT(*) assigned_total,
        SUM(status IN ('assigned','picked_up')) awaiting_pickup,
        SUM(status='in_transit') in_transit,
        SUM(status='delivered') delivered,
        SUM(status='failed') failed
       FROM deliveries
       WHERE delivery_user_id=?`,
      [req.user.id],
    );
    const [recent] = await pool.query(
      `SELECT d.id,d.status,d.assigned_at,d.delivered_at,o.order_number,o.delivery_address,o.total
       FROM deliveries d
       JOIN orders o ON o.id=d.order_id
       WHERE d.delivery_user_id=?
       ORDER BY COALESCE(d.delivered_at,d.assigned_at) DESC
       LIMIT 5`,
      [req.user.id],
    );
    res.json({ stats, recent });
  }),
);
app.get(
  "/api/deliveries/mine",
  authenticate,
  authorize("delivery"),
  asyncRoute(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT
        d.*,
        o.order_number,
        o.delivery_address,
        o.total,
        o.created_at order_created_at,
        client.name client_name,
        client.phone client_phone,
        COUNT(DISTINCT oi.id) item_count,
        GROUP_CONCAT(DISTINCT COALESCE(sp.shop_name,seller.name) ORDER BY seller.name SEPARATOR ', ') pickup_shops,
        GROUP_CONCAT(DISTINCT COALESCE(sp.pickup_address,'Adresse boutique non renseignée') SEPARATOR ' | ') pickup_addresses
       FROM deliveries d
       JOIN orders o ON o.id=d.order_id
       JOIN users client ON client.id=o.client_id
       LEFT JOIN order_items oi ON oi.order_id=o.id
       LEFT JOIN users seller ON seller.id=oi.seller_id
       LEFT JOIN seller_profiles sp ON sp.seller_id=seller.id
       WHERE d.delivery_user_id=?
       GROUP BY d.id,o.id,client.id
       ORDER BY COALESCE(d.delivered_at,d.assigned_at) DESC`,
      [req.user.id],
    );
    res.json(rows);
  }),
);
app.get(
  "/api/management/deliveries",
  authenticate,
  authorize("manager"),
  asyncRoute(async (_req, res) => {
    const [deliveries] = await pool.query(
      `SELECT d.*,o.order_number,o.delivery_address,o.total,u.name delivery_name
       FROM deliveries d
       JOIN orders o ON o.id=d.order_id
       LEFT JOIN users u ON u.id=d.delivery_user_id
       WHERE NOT EXISTS (
         SELECT 1 FROM seller_sales ss
         WHERE ss.order_id=o.id AND ss.status NOT IN ('ready','completed','cancelled')
       )
       ORDER BY d.assigned_at IS NULL DESC,o.created_at DESC`,
    );
    const [drivers] = await pool.query(
      `SELECT DISTINCT u.id,u.name,u.email,u.phone
       FROM users u
       JOIN user_roles ur ON ur.user_id=u.id AND ur.role='delivery'
       WHERE u.status='active'
       ORDER BY u.name`,
    );
    res.json({ deliveries, drivers });
  }),
);
app.patch(
  "/api/management/deliveries/:id/assign",
  authenticate,
  authorize("manager"),
  [body("deliveryUserId").isInt()],
  validate,
  asyncRoute(async (req, res) => {
    const [[driver]] = await pool.query(
      `SELECT u.id FROM users u
       JOIN user_roles ur ON ur.user_id=u.id AND ur.role='delivery'
       WHERE u.id=? AND u.status='active'`,
      [req.body.deliveryUserId],
    );
    if (!driver) return res.status(404).json({ message: "Livreur introuvable." });
    const [result] = await pool.query(
      `UPDATE deliveries d
       JOIN orders o ON o.id=d.order_id
       SET d.delivery_user_id=?,d.status='assigned',d.assigned_at=NOW()
       WHERE d.id=?
       AND NOT EXISTS (
         SELECT 1 FROM seller_sales ss
         WHERE ss.order_id=o.id AND ss.status NOT IN ('ready','completed','cancelled')
       )`,
      [driver.id, req.params.id],
    );
    if (!result.affectedRows)
      return res.status(409).json({ message: "La commande n'est pas encore prête." });
    res.json({ message: "Livraison assignée." });
  }),
);
app.patch(
  "/api/deliveries/:id/status",
  authenticate,
  authorize("delivery"),
  [body("status").isIn(["picked_up", "in_transit", "delivered", "failed"])],
  validate,
  asyncRoute(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[delivery]] = await connection.query(
        "SELECT id,order_id,status FROM deliveries WHERE id=? AND delivery_user_id=? FOR UPDATE",
        [req.params.id, req.user.id],
      );
      if (!delivery) {
        await connection.rollback();
        return res.status(404).json({ message: "Livraison introuvable." });
      }
      const allowedTransitions = {
        assigned: ["picked_up", "failed"],
        picked_up: ["in_transit", "failed"],
        in_transit: ["delivered", "failed"],
      };
      if (!allowedTransitions[delivery.status]?.includes(req.body.status)) {
        await connection.rollback();
        return res.status(409).json({ message: "Cette étape de livraison n'est pas autorisée." });
      }
      await connection.query(
        "UPDATE deliveries SET status=?,delivered_at=IF(?='delivered',NOW(),delivered_at) WHERE id=?",
        [req.body.status, req.body.status, delivery.id],
      );
      if (req.body.status === "delivered") {
        await connection.query("UPDATE orders SET status='delivered' WHERE id=?", [
          delivery.order_id,
        ]);
        await connection.query(
          "UPDATE seller_sales SET status='completed' WHERE order_id=? AND status='ready'",
          [delivery.order_id],
        );
      } else if (req.body.status === "in_transit") {
        await connection.query("UPDATE orders SET status='shipped' WHERE id=?", [
          delivery.order_id,
        ]);
      }
      await connection.commit();
      res.json({ message: "Livraison mise à jour." });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);

app.get(
  "/api/admin/seller-requests",
  authenticate,
  authorize("supervisor"),
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      "SELECT sr.*,u.name,u.email,u.phone FROM seller_requests sr JOIN users u ON u.id=sr.user_id ORDER BY sr.created_at DESC",
    );
    res.json(rows);
  }),
);
app.patch(
  "/api/admin/seller-requests/:id",
  authenticate,
  authorize("supervisor"),
  [
    body("status").isIn(["approved", "rejected"]),
    body("reason")
      .if(body("status").equals("rejected"))
      .trim()
      .isLength({ min: 8 })
      .withMessage("Le motif du refus est obligatoire."),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[request]] = await connection.query(
        "SELECT * FROM seller_requests WHERE id=? AND status='pending' FOR UPDATE",
        [req.params.id],
      );
      if (!request) {
        await connection.rollback();
        return res.status(404).json({ message: "Demande introuvable." });
      }
      await connection.query(
        "UPDATE seller_requests SET status=?,rejection_reason=?,reviewed_by=?,reviewed_at=NOW() WHERE id=?",
        [req.body.status, req.body.reason || null, req.user.id, req.params.id],
      );
      if (req.body.status === "approved") {
        await connection.query("UPDATE users SET role='seller' WHERE id=?", [
          request.user_id,
        ]);
        await connection.query(
          "INSERT IGNORE INTO user_roles (user_id,role) VALUES (?,'client'),(?,'seller')",
          [request.user_id, request.user_id],
        );
      }
      await connection.commit();
      res.json({ message: `Demande ${req.body.status}.` });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);
app.get(
  "/api/admin/reports",
  authenticate,
  authorize("manager", "supervisor"),
  asyncRoute(async (_req, res) => {
    const [[stats]] = await pool.query(
      "SELECT (SELECT COUNT(*) FROM users) users,(SELECT COUNT(*) FROM products WHERE status='active') products,(SELECT COUNT(*) FROM orders) orders,(SELECT COALESCE(SUM(total),0) FROM orders) revenue",
    );
    res.json(stats);
  }),
);
app.get(
  "/api/admin/users",
  authenticate,
  authorize("admin"),
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      "SELECT id,name,email,phone,role,status,created_at FROM users ORDER BY created_at DESC",
    );
    res.json(rows);
  }),
);

app.get(
  "/api/messages/contacts",
  authenticate,
  asyncRoute(async (req, res) => {
    const roles = await getUserRoles(req.user.id, req.user.role);
    if (!roles.includes("client")) return res.json([]);
    const [sellers] = await pool.query(
      `SELECT DISTINCT u.id,
        COALESCE(sp.shop_name,u.name) name,
        COALESCE(sp.shop_logo_url,u.profile_image_url) image_url,
        sp.category
       FROM users u
       JOIN user_roles ur ON ur.user_id=u.id AND ur.role='seller'
       LEFT JOIN seller_profiles sp ON sp.seller_id=u.id
       WHERE u.status='active' AND u.id<>?
       ORDER BY name`,
      [req.user.id],
    );
    res.json(sellers);
  }),
);
app.get(
  "/api/messages/conversations",
  authenticate,
  asyncRoute(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT c.id,c.client_id,c.seller_id,c.updated_at,
        CASE WHEN c.client_id=? THEN COALESCE(sp.shop_name,seller.name) ELSE client.name END name,
        CASE WHEN c.client_id=? THEN COALESCE(sp.shop_logo_url,seller.profile_image_url) ELSE client.profile_image_url END image_url,
        (SELECT body FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) last_message,
        (SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) last_message_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND sender_id<>? AND read_at IS NULL) unread_count
       FROM conversations c
       JOIN users client ON client.id=c.client_id
       JOIN users seller ON seller.id=c.seller_id
       LEFT JOIN seller_profiles sp ON sp.seller_id=c.seller_id
       WHERE c.client_id=? OR c.seller_id=?
       ORDER BY COALESCE(last_message_at,c.updated_at) DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id],
    );
    res.json(rows);
  }),
);
app.post(
  "/api/messages/conversations",
  authenticate,
  [body("sellerId").isInt({ min: 1 })],
  validate,
  asyncRoute(async (req, res) => {
    const roles = await getUserRoles(req.user.id, req.user.role);
    if (!roles.includes("client")) return res.status(403).json({ message: "Action réservée aux clients." });
    const [[seller]] = await pool.query(
      "SELECT user_id FROM user_roles WHERE user_id=? AND role='seller'",
      [req.body.sellerId],
    );
    if (!seller) return res.status(404).json({ message: "Vendeur introuvable." });
    await pool.query(
      "INSERT IGNORE INTO conversations (client_id,seller_id) VALUES (?,?)",
      [req.user.id, req.body.sellerId],
    );
    const [[conversation]] = await pool.query(
      "SELECT id FROM conversations WHERE client_id=? AND seller_id=?",
      [req.user.id, req.body.sellerId],
    );
    res.status(201).json(conversation);
  }),
);
app.post(
  "/api/messages/support",
  authenticate,
  asyncRoute(async (req, res) => {
    const [[support]] = await pool.query(
      "SELECT id FROM users WHERE role='admin' AND status='active' ORDER BY id LIMIT 1",
    );
    if (!support) return res.status(404).json({ message: "Support VinnHT indisponible." });
    await pool.query(
      "INSERT IGNORE INTO conversations (client_id,seller_id) VALUES (?,?)",
      [req.user.id, support.id],
    );
    const [[conversation]] = await pool.query(
      "SELECT id FROM conversations WHERE client_id=? AND seller_id=?",
      [req.user.id, support.id],
    );
    res.status(201).json(conversation);
  }),
);
app.get(
  "/api/messages/conversations/:id",
  authenticate,
  asyncRoute(async (req, res) => {
    const [[conversation]] = await pool.query(
      "SELECT id FROM conversations WHERE id=? AND (client_id=? OR seller_id=?)",
      [req.params.id, req.user.id, req.user.id],
    );
    if (!conversation) return res.status(404).json({ message: "Conversation introuvable." });
    await pool.query(
      "UPDATE messages SET read_at=COALESCE(read_at,NOW()) WHERE conversation_id=? AND sender_id<>?",
      [req.params.id, req.user.id],
    );
    const [messages] = await pool.query(
      `SELECT m.id,m.body,m.created_at,m.sender_id,u.name sender_name
       FROM messages m JOIN users u ON u.id=m.sender_id
       WHERE m.conversation_id=? ORDER BY m.created_at`,
      [req.params.id],
    );
    res.json(messages);
  }),
);
app.post(
  "/api/messages/conversations/:id",
  authenticate,
  [body("body").trim().isLength({ min: 1, max: 2000 })],
  validate,
  asyncRoute(async (req, res) => {
    const [[conversation]] = await pool.query(
      "SELECT id FROM conversations WHERE id=? AND (client_id=? OR seller_id=?)",
      [req.params.id, req.user.id, req.user.id],
    );
    if (!conversation) return res.status(404).json({ message: "Conversation introuvable." });
    const [result] = await pool.query(
      "INSERT INTO messages (conversation_id,sender_id,body) VALUES (?,?,?)",
      [req.params.id, req.user.id, req.body.body],
    );
    await pool.query("UPDATE conversations SET updated_at=NOW() WHERE id=?", [req.params.id]);
    res.status(201).json({ id: result.insertId, message: "Message envoyé." });
  }),
);

app.use((_req, res) => res.status(404).json({ message: "Route introuvable." }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res
    .status(error.status || 500)
    .json({
      message: error.status
        ? error.message
        : "Une erreur interne est survenue.",
    });
});

const port = Number(process.env.PORT || 5056);
app.listen(port, () =>
  console.log(`VinnHT API disponible sur http://localhost:${port}`),
);
