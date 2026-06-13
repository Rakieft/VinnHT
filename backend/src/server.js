import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import { body, validationResult } from "express-validator";
import fs from "node:fs";
import https from "node:https";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import pool from "./config/database.js";
import { authenticate } from "./middleware/authMiddleware.js";
import { authorize } from "./middleware/roleMiddleware.js";
import {
  uploadProductImages,
  uploadProfileImage,
  uploadSellerImages,
} from "./middleware/uploadMiddleware.js";
import {
  createRateLimiter,
  noStore,
  securityHeaders,
} from "./middleware/securityMiddleware.js";
import { generateToken } from "./utils/generateToken.js";
import { clearSessionCookie, setSessionCookie } from "./utils/sessionCookie.js";
import { storeImage, storeImages } from "./utils/imageStorage.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET doit contenir au moins 32 caractères.");
}

const app = express();
const backendDirectory = fileURLToPath(new URL("../", import.meta.url));
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(securityHeaders);
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
        .split(",")
        .map((value) => value.trim());
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Origine non autorisée."));
    },
    credentials: true,
    exposedHeaders: ["X-Total-Count", "X-Page", "X-Page-Limit"],
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(`${backendDirectory}/uploads`));

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
});
const writeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
});
const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 600,
});
app.use("/api", apiRateLimiter);

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

const dateOnly = (value) => new Date(`${value}T12:00:00`);
const sqlDate = (date) => date.toISOString().slice(0, 10);
const reportPeriod = (endingValue) => {
  const ending = endingValue ? dateOnly(endingValue) : new Date();
  if (Number.isNaN(ending.getTime())) throw new Error("Date de rapport invalide.");
  ending.setHours(12, 0, 0, 0);
  ending.setDate(ending.getDate() + ((6 - ending.getDay() + 7) % 7));
  const start = new Date(ending);
  start.setDate(ending.getDate() - 6);
  const exclusiveEnd = new Date(ending);
  exclusiveEnd.setDate(ending.getDate() + 1);
  return {
    start: sqlDate(start),
    end: sqlDate(ending),
    exclusiveEnd: sqlDate(exclusiveEnd),
  };
};
const previousWeekForSunday = (value = new Date()) => {
  const sunday = value instanceof Date ? new Date(value) : dateOnly(value);
  sunday.setHours(12, 0, 0, 0);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  const periodEnd = new Date(sunday);
  periodEnd.setDate(sunday.getDate() - 1);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodEnd.getDate() - 6);
  return {
    start: sqlDate(periodStart),
    end: sqlDate(periodEnd),
    scheduledFor: sqlDate(sunday),
  };
};
const prepareWeeklyPayoutBatch = async (sundayValue = new Date()) => {
  const period = previousWeekForSunday(sundayValue);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT IGNORE INTO payout_batches (period_start,period_end,scheduled_for)
       VALUES (?,?,?)`,
      [period.start, period.end, period.scheduledFor],
    );
    const [[batch]] = await connection.query(
      "SELECT * FROM payout_batches WHERE period_start=? AND period_end=? FOR UPDATE",
      [period.start, period.end],
    );
    if (batch.status === "prepared") {
      await connection.query(
        `INSERT INTO payout_batch_items (batch_id,seller_id,amount,sale_count)
         SELECT ?,ss.seller_id,SUM(ss.net_amount),COUNT(*)
         FROM seller_sales ss
         JOIN payments pay ON pay.order_id=ss.order_id AND pay.status='paid'
         WHERE ss.status='completed'
           AND COALESCE(pay.paid_at,pay.created_at)>=?
           AND COALESCE(pay.paid_at,pay.created_at)<DATE_ADD(?,INTERVAL 1 DAY)
         GROUP BY ss.seller_id
         ON DUPLICATE KEY UPDATE amount=VALUES(amount),sale_count=VALUES(sale_count)`,
        [batch.id, period.start, period.end],
      );
      await connection.query(
        `UPDATE payout_batches
         SET total_amount=(
           SELECT COALESCE(SUM(amount),0) FROM payout_batch_items WHERE batch_id=?
         )
         WHERE id=?`,
        [batch.id, batch.id],
      );
    }
    await connection.commit();
    const [[prepared]] = await pool.query("SELECT * FROM payout_batches WHERE id=?", [batch.id]);
    return prepared;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
const getWeeklyMerchantReport = async (endingValue) => {
  const period = reportPeriod(endingValue);
  const [merchants] = await pool.query(
    `SELECT
      ss.seller_id,
      COALESCE(sp.shop_name,u.name) merchant_name,
      u.email merchant_email,
      COUNT(DISTINCT ss.order_id) order_count,
      COALESCE(SUM(ss.gross_amount),0) gross_sales,
      COALESCE(SUM(ss.commission_amount),0) commission_total,
      COALESCE(SUM(ss.net_amount),0) net_sales
     FROM seller_sales ss
     JOIN users u ON u.id=ss.seller_id
     LEFT JOIN seller_profiles sp ON sp.seller_id=ss.seller_id
     JOIN payments pay ON pay.order_id=ss.order_id AND pay.status='paid'
     WHERE ss.status!='cancelled'
       AND COALESCE(pay.paid_at,pay.created_at)>=?
       AND COALESCE(pay.paid_at,pay.created_at)<?
     GROUP BY ss.seller_id,sp.shop_name,u.name,u.email
     ORDER BY gross_sales DESC,merchant_name`,
    [period.start, period.exclusiveEnd],
  );
  const [items] = await pool.query(
    `SELECT
      oi.seller_id,
      oi.order_id,
      o.order_number,
      client.name client_name,
      p.name product_name,
      oi.quantity,
      oi.unit_price,
      oi.subtotal,
      COALESCE(pay.paid_at,pay.created_at) paid_at
     FROM order_items oi
     JOIN orders o ON o.id=oi.order_id
     JOIN users client ON client.id=o.client_id
     JOIN products p ON p.id=oi.product_id
     JOIN payments pay ON pay.order_id=o.id AND pay.status='paid'
     JOIN seller_sales ss ON ss.order_id=o.id AND ss.seller_id=oi.seller_id
     WHERE ss.status!='cancelled'
       AND COALESCE(pay.paid_at,pay.created_at)>=?
       AND COALESCE(pay.paid_at,pay.created_at)<?
     ORDER BY oi.seller_id,paid_at,oi.order_id,p.name`,
    [period.start, period.exclusiveEnd],
  );
  const itemsBySeller = new Map();
  for (const item of items) {
    if (!itemsBySeller.has(item.seller_id)) itemsBySeller.set(item.seller_id, []);
    itemsBySeller.get(item.seller_id).push(item);
  }
  const totals = merchants.reduce(
    (summary, merchant) => ({
      merchants: summary.merchants + 1,
      orders: summary.orders + Number(merchant.order_count || 0),
      grossSales: summary.grossSales + Number(merchant.gross_sales || 0),
      commission: summary.commission + Number(merchant.commission_total || 0),
      netSales: summary.netSales + Number(merchant.net_sales || 0),
    }),
    { merchants: 0, orders: 0, grossSales: 0, commission: 0, netSales: 0 },
  );
  return {
    period,
    totals,
    merchants: merchants.map((merchant) => ({
      ...merchant,
      items: itemsBySeller.get(merchant.seller_id) || [],
    })),
  };
};
const pdfMoney = (value) => `${Number(value || 0).toLocaleString("fr-FR")} HTG`;
const pdfDate = (value) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
const ensurePdfSpace = (doc, height = 80) => {
  if (doc.y + height > doc.page.height - 55) doc.addPage();
};
const pdfText = (value, fallback = "—") => String(value || fallback).replace(/\s+/g, " ").trim();
const drawPdfMetric = (doc, x, y, width, label, value, color = "#2563EB") => {
  doc.roundedRect(x, y, width, 68, 12).fill("#F8FAFC");
  const displayValue = pdfText(value);
  const valueSize = displayValue.length > 16 ? 11 : displayValue.length > 11 ? 14 : 19;
  doc.fillColor(color).fontSize(valueSize).font("Helvetica-Bold").text(displayValue, x + 12, y + 14, {
    width: width - 24,
    height: 22,
    ellipsis: true,
    lineBreak: false,
  });
  doc.fillColor("#64748B").fontSize(8).font("Helvetica-Bold").text(label, x + 12, y + 42, {
    width: width - 24,
    height: 14,
    ellipsis: true,
  });
};
const buildWeeklyReportPdf = (res, report) => {
  const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true });
  doc.pipe(res);
  const pageWidth = doc.page.width - 84;
  doc.rect(0, 0, doc.page.width, 150).fill("#0F172A");
  doc.fillColor("#F59E0B").font("Helvetica-Bold").fontSize(10).text("VINNHT", 42, 38);
  doc.fillColor("#FFFFFF").fontSize(25).text("Rapport hebdomadaire des marchands", 42, 57);
  doc
    .fillColor("#DBEAFE")
    .font("Helvetica")
    .fontSize(10)
    .text(`Période du ${pdfDate(report.period.start)} au ${pdfDate(report.period.end)}`, 42, 96);
  doc
    .fillColor("#94A3B8")
    .fontSize(8)
    .text(`Généré le ${pdfDate(new Date())} · Le marché numérique d’Haïti`, 42, 116);

  let metricY = 172;
  const metricGap = 9;
  const metricWidth = (pageWidth - metricGap * 3) / 4;
  drawPdfMetric(doc, 42, metricY, metricWidth, "MARCHANDS ACTIFS", report.totals.merchants);
  drawPdfMetric(
    doc,
    42 + metricWidth + metricGap,
    metricY,
    metricWidth,
    "COMMANDES MARCHANDS",
    report.totals.orders,
    "#0F172A",
  );
  drawPdfMetric(
    doc,
    42 + (metricWidth + metricGap) * 2,
    metricY,
    metricWidth,
    "VENTES GLOBALES",
    pdfMoney(report.totals.grossSales),
    "#22C55E",
  );
  drawPdfMetric(
    doc,
    42 + (metricWidth + metricGap) * 3,
    metricY,
    metricWidth,
    "NET VENDEURS",
    pdfMoney(report.totals.netSales),
    "#F59E0B",
  );

  doc.y = metricY + 94;
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(15).text("Synthèse par marchand");
  doc.moveDown(0.6);
  const columns = [
    ["Marchand", 42, 175],
    ["Commandes", 217, 68],
    ["Ventes brutes", 285, 92],
    ["Commission", 377, 78],
    ["Net vendeur", 455, 98],
  ];
  doc.roundedRect(42, doc.y, pageWidth, 24, 6).fill("#EAF2FF");
  const summaryHeaderY = doc.y;
  for (const [label, x, width] of columns) {
    doc.fillColor("#1D4ED8").font("Helvetica-Bold").fontSize(7).text(label, x + 5, summaryHeaderY + 8, {
      width: width - 10,
      lineBreak: false,
    });
  }
  doc.y = summaryHeaderY + 29;
  for (const merchant of report.merchants) {
    const merchantName = pdfText(merchant.merchant_name);
    doc.font("Helvetica-Bold").fontSize(7);
    const merchantNameHeight = doc.heightOfString(merchantName, {
      width: columns[0][2] - 10,
    });
    const rowHeight = Math.max(25, Math.min(38, merchantNameHeight + 14));
    ensurePdfSpace(doc, rowHeight + 4);
    const y = doc.y;
    doc.rect(42, y, pageWidth, rowHeight).fill("#FFFFFF").stroke("#E2E8F0");
    const values = [
      merchantName,
      merchant.order_count,
      pdfMoney(merchant.gross_sales),
      pdfMoney(merchant.commission_total),
      pdfMoney(merchant.net_sales),
    ];
    values.forEach((value, index) => {
      const [, x, width] = columns[index];
      doc
        .fillColor("#0F172A")
        .font(index === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(7)
        .text(String(value), x + 5, y + 8, {
          width: width - 10,
          height: rowHeight - 12,
          ellipsis: true,
          lineBreak: index === 0,
        });
    });
    doc.y = y + rowHeight + 4;
  }

  for (const merchant of report.merchants) {
    ensurePdfSpace(doc, 145);
    doc.moveDown(0.7);
    const titleY = doc.y;
    doc.roundedRect(42, titleY, pageWidth, 44, 10).fill("#0F172A");
    const merchantName = pdfText(merchant.merchant_name);
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(merchantName, 55, titleY + 9, {
        width: 315,
        height: 17,
        ellipsis: true,
        lineBreak: false,
      });
    doc
      .fillColor("#BFDBFE")
      .font("Helvetica")
      .fontSize(8)
      .text(`${merchant.order_count} commande(s) · ${pdfMoney(merchant.gross_sales)}`, 55, titleY + 28, {
        width: 315,
        height: 11,
        ellipsis: true,
        lineBreak: false,
      });
    doc
      .fillColor("#F59E0B")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(`Net: ${pdfMoney(merchant.net_sales)}`, 390, titleY + 17, {
        width: 145,
        height: 13,
        align: "right",
        ellipsis: true,
        lineBreak: false,
      });
    doc.y = titleY + 54;
    const orders = new Map();
    for (const item of merchant.items) {
      if (!orders.has(item.order_id)) {
        orders.set(item.order_id, {
          number: item.order_number,
          client: item.client_name,
          paidAt: item.paid_at,
          items: [],
        });
      }
      orders.get(item.order_id).items.push(item);
    }
    for (const order of orders.values()) {
      const orderTitle = `${pdfText(order.number)} · ${pdfText(order.client)} · ${pdfDate(order.paidAt)}`;
      doc.font("Helvetica-Bold").fontSize(9);
      const orderTitleHeight = Math.min(28, doc.heightOfString(orderTitle, { width: pageWidth }));
      ensurePdfSpace(doc, 28 + orderTitleHeight + order.items.length * 18);
      const orderTitleY = doc.y;
      doc
        .fillColor("#2563EB")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(orderTitle, 42, orderTitleY, {
          width: pageWidth,
          height: orderTitleHeight,
          ellipsis: true,
        });
      doc.y = orderTitleY + orderTitleHeight + 5;
      for (const item of order.items) {
        const y = doc.y;
        doc
          .fillColor("#334155")
          .font("Helvetica")
          .fontSize(8)
          .text(`${pdfText(item.product_name)} × ${item.quantity}`, 55, y, {
            width: 310,
            height: 12,
            ellipsis: true,
            lineBreak: false,
          });
        doc
          .fillColor("#0F172A")
          .font("Helvetica-Bold")
          .text(pdfMoney(item.subtotal), 390, y, {
            width: 145,
            height: 12,
            align: "right",
            ellipsis: true,
            lineBreak: false,
          });
        doc.y = y + 17;
      }
      doc.moveDown(0.35);
    }
  }

  if (!report.merchants.length) {
    doc
      .fillColor("#64748B")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Aucune vente payée enregistrée pendant cette période.", 42, doc.y + 25, {
        width: pageWidth,
        align: "center",
      });
  }
  const range = doc.bufferedPageRange();
  for (let pageIndex = 0; pageIndex < range.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    doc
      .fillColor("#94A3B8")
      .font("Helvetica")
      .fontSize(7)
      .text(`VinnHT · Rapport confidentiel · Page ${pageIndex + 1}/${range.count}`, 42, 805, {
        width: pageWidth,
        align: "center",
      });
  }
  doc.end();
};
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
const audit = async (req, action, entityType, entityId = null, details = null) => {
  await pool.query(
    `INSERT INTO audit_logs
      (actor_user_id,action,entity_type,entity_id,details,ip_address)
     VALUES (?,?,?,?,?,?)`,
    [
      req.user?.id || null,
      action,
      entityType,
      entityId === null ? null : String(entityId),
      details ? JSON.stringify(details) : null,
      req.ip || null,
    ],
  );
};
const notifyUser = async (
  executor,
  userId,
  role,
  type,
  title,
  message,
  link = null,
  entityType = null,
  entityId = null,
) => {
  await executor.query(
    `INSERT INTO notifications
      (user_id,role,type,title,message,link,entity_type,entity_id)
     VALUES (?,?,?,?,?,?,?,?)`,
    [userId, role, type, title, message, link, entityType, entityId],
  );
};
const notifyRole = async (
  executor,
  role,
  type,
  title,
  message,
  link = null,
  entityType = null,
  entityId = null,
) => {
  await executor.query(
    `INSERT INTO notifications
      (user_id,role,type,title,message,link,entity_type,entity_id)
     SELECT DISTINCT u.id,?,?,?,?,?,?,?
     FROM users u
     JOIN user_roles ur ON ur.user_id=u.id AND ur.role=?
     WHERE u.status='active'`,
    [role, type, title, message, link, entityType, entityId, role],
  );
};
const clientProductSelect = `
  SELECT p.*,c.name category_name,u.name seller_name,
    CASE
      WHEN p.is_featured=TRUE
        AND p.promotional_price IS NOT NULL
        AND p.promotional_price < p.price
        AND (p.offer_ends_at IS NULL OR p.offer_ends_at > NOW())
      THEN p.promotional_price
      ELSE p.price
    END current_price
  FROM products p
  JOIN categories c ON c.id=p.category_id
  JOIN users u ON u.id=p.seller_id
`;
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
  authRateLimiter,
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
      .isLength({ min: 10, max: 128 })
      .matches(/[a-z]/)
      .matches(/[A-Z]/)
      .matches(/[0-9]/)
      .withMessage(
        "Le mot de passe doit contenir au moins 10 caractères, une majuscule, une minuscule et un chiffre.",
      ),
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
    setSessionCookie(res, generateToken(user));
    res.status(201).json({ user });
  }),
);

app.post(
  "/api/auth/login",
  authRateLimiter,
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
    setSessionCookie(res, generateToken(safeUser));
    res.json({ user: safeUser });
  }),
);
app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ message: "Session fermée." });
});
app.get(
  "/api/auth/me",
  authenticate,
  noStore,
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
  writeRateLimiter,
  uploadProfileImage,
  [
    body("name").optional().trim().isLength({ min: 2, max: 120 }),
    body("phone").optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 30 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const profileImageUrl = (await storeImage(req.file, "profiles")) || undefined;
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
  writeRateLimiter,
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
  "/api/marketplace/stats",
  asyncRoute(async (_req, res) => {
    const [[stats]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE status='active') active_users,
        (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role='seller') sellers,
        (SELECT COUNT(*) FROM products WHERE status='active' AND stock>0) products,
        (SELECT COUNT(*) FROM orders) orders`,
    );
    res.json(stats);
  }),
);
app.post(
  "/api/contact",
  writeRateLimiter,
  [
    body("name").trim().isLength({ min: 2, max: 160 }),
    body("email").isEmail().normalizeEmail(),
    body("subject").trim().isLength({ min: 3, max: 190 }),
    body("message").trim().isLength({ min: 10, max: 3000 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const [result] = await pool.query(
      `INSERT INTO contact_requests (name,email,subject,message)
       VALUES (?,?,?,?)`,
      [req.body.name, req.body.email, req.body.subject, req.body.message],
    );
    res.status(201).json({
      id: result.insertId,
      message: "Votre message a été transmis au support VinnHT.",
    });
  }),
);
app.get(
  "/api/preferences/:group",
  authenticate,
  asyncRoute(async (req, res) => {
    const [[row]] = await pool.query(
      "SELECT preferences FROM user_preferences WHERE user_id=? AND preference_group=?",
      [req.user.id, req.params.group],
    );
    res.json(row?.preferences || {});
  }),
);
app.put(
  "/api/preferences/:group",
  authenticate,
  writeRateLimiter,
  [
    body("preferences").isObject(),
    body("preferences.*").isBoolean(),
  ],
  validate,
  asyncRoute(async (req, res) => {
    await pool.query(
      `INSERT INTO user_preferences (user_id,preference_group,preferences)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE preferences=VALUES(preferences)`,
      [req.user.id, req.params.group, JSON.stringify(req.body.preferences)],
    );
    res.json({ message: "Préférences enregistrées.", preferences: req.body.preferences });
  }),
);
app.get(
  "/api/products",
  asyncRoute(async (req, res) => {
    const params = [];
    let where = "WHERE p.status = 'active' AND p.stock > 0";
    if (req.query.category) {
      where += " AND c.slug = ?";
      params.push(req.query.category);
    }
    if (req.query.search) {
      where += ` AND (
        p.name LIKE ? OR p.description LIKE ? OR u.name LIKE ? OR c.name LIKE ?
      )`;
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
    if (req.query.offers === "true") {
      where +=
        " AND p.is_featured=TRUE AND p.promotional_price IS NOT NULL AND p.promotional_price < p.price AND (p.offer_ends_at IS NULL OR p.offer_ends_at > NOW())";
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 48));
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT p.*, c.name category_name, u.name seller_name,
        EXISTS(
          SELECT 1 FROM seller_sponsorships ss
          WHERE ss.seller_id=p.seller_id
            AND ss.status='active'
            AND ss.starts_at<=NOW()
            AND ss.ends_at>NOW()
        ) is_sponsored
       FROM products p
       JOIN categories c ON c.id=p.category_id
       JOIN users u ON u.id=p.seller_id
       ${where}
       ORDER BY is_sponsored DESC,p.is_featured DESC,p.created_at DESC
       LIMIT ? OFFSET ?`,
      [
        ...params,
        limit,
        offset,
      ],
    );
    const [[count]] = await pool.query(
      `SELECT COUNT(*) total
       FROM products p
       JOIN categories c ON c.id=p.category_id
       JOIN users u ON u.id=p.seller_id
       ${where}`,
      params,
    );
    res.set("X-Total-Count", String(count.total));
    res.set("X-Page", String(page));
    res.set("X-Page-Limit", String(limit));
    res.json(rows);
  }),
);
app.get(
  "/api/favorites",
  authenticate,
  authorize("client"),
  asyncRoute(async (req, res) => {
    const [rows] = await pool.query(
      `${clientProductSelect}
       JOIN favorites f ON f.product_id=p.id
       WHERE f.user_id=? AND p.status='active' AND p.stock>0
       ORDER BY f.created_at DESC`,
      [req.user.id],
    );
    res.json(rows);
  }),
);
app.post(
  "/api/favorites/:productId",
  authenticate,
  authorize("client"),
  writeRateLimiter,
  asyncRoute(async (req, res) => {
    const [[product]] = await pool.query(
      "SELECT id FROM products WHERE id=? AND status='active' AND stock>0",
      [req.params.productId],
    );
    if (!product) return res.status(404).json({ message: "Produit indisponible." });
    await pool.query("INSERT IGNORE INTO favorites (user_id,product_id) VALUES (?,?)", [
      req.user.id,
      product.id,
    ]);
    res.status(201).json({ message: "Produit ajouté aux favoris." });
  }),
);
app.delete(
  "/api/favorites/:productId",
  authenticate,
  authorize("client"),
  writeRateLimiter,
  asyncRoute(async (req, res) => {
    await pool.query("DELETE FROM favorites WHERE user_id=? AND product_id=?", [
      req.user.id,
      req.params.productId,
    ]);
    res.json({ message: "Produit retiré des favoris." });
  }),
);
app.post(
  "/api/favorites/sync",
  authenticate,
  authorize("client"),
  writeRateLimiter,
  [body("productIds").isArray({ max: 500 }), body("productIds.*").isInt({ min: 1 })],
  validate,
  asyncRoute(async (req, res) => {
    const ids = [...new Set(req.body.productIds.map(Number))];
    for (const productId of ids) {
      await pool.query(
        `INSERT IGNORE INTO favorites (user_id,product_id)
         SELECT ?,id FROM products WHERE id=? AND status='active' AND stock>0`,
        [req.user.id, productId],
      );
    }
    res.json({ message: "Favoris synchronisés." });
  }),
);
app.get(
  "/api/cart",
  authenticate,
  authorize("client"),
  asyncRoute(async (req, res) => {
    await pool.query(
      `DELETE ci FROM cart_items ci
       JOIN products p ON p.id=ci.product_id
       WHERE ci.user_id=? AND (p.status<>'active' OR p.stock<1)`,
      [req.user.id],
    );
    await pool.query(
      `UPDATE cart_items ci
       JOIN products p ON p.id=ci.product_id
       SET ci.quantity=LEAST(ci.quantity,p.stock)
       WHERE ci.user_id=?`,
      [req.user.id],
    );
    const [rows] = await pool.query(
      `SELECT p.*,c.name category_name,u.name seller_name,ci.quantity,
        CASE
          WHEN p.is_featured=TRUE
            AND p.promotional_price IS NOT NULL
            AND p.promotional_price < p.price
            AND (p.offer_ends_at IS NULL OR p.offer_ends_at > NOW())
          THEN p.promotional_price
          ELSE p.price
        END current_price
       FROM cart_items ci
       JOIN products p ON p.id=ci.product_id
       JOIN categories c ON c.id=p.category_id
       JOIN users u ON u.id=p.seller_id
       WHERE ci.user_id=? AND p.status='active' AND p.stock>0
       ORDER BY ci.updated_at DESC`,
      [req.user.id],
    );
    res.json(rows.map((row) => ({ ...row, price: row.current_price })));
  }),
);
app.put(
  "/api/cart/:productId",
  authenticate,
  authorize("client"),
  writeRateLimiter,
  [body("quantity").isInt({ min: 1 })],
  validate,
  asyncRoute(async (req, res) => {
    const [[product]] = await pool.query(
      "SELECT id,stock FROM products WHERE id=? AND status='active' AND stock>0",
      [req.params.productId],
    );
    if (!product) return res.status(404).json({ message: "Produit indisponible." });
    if (Number(req.body.quantity) > product.stock) {
      return res.status(409).json({ message: `Stock disponible : ${product.stock}.` });
    }
    await pool.query(
      `INSERT INTO cart_items (user_id,product_id,quantity)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE quantity=VALUES(quantity)`,
      [req.user.id, product.id, req.body.quantity],
    );
    res.json({ message: "Panier mis à jour.", quantity: Number(req.body.quantity) });
  }),
);
app.delete(
  "/api/cart/:productId",
  authenticate,
  authorize("client"),
  writeRateLimiter,
  asyncRoute(async (req, res) => {
    await pool.query("DELETE FROM cart_items WHERE user_id=? AND product_id=?", [
      req.user.id,
      req.params.productId,
    ]);
    res.json({ message: "Produit retiré du panier." });
  }),
);
app.delete(
  "/api/cart",
  authenticate,
  authorize("client"),
  writeRateLimiter,
  asyncRoute(async (req, res) => {
    await pool.query("DELETE FROM cart_items WHERE user_id=?", [req.user.id]);
    res.json({ message: "Panier vidé." });
  }),
);
app.post(
  "/api/cart/sync",
  authenticate,
  authorize("client"),
  writeRateLimiter,
  [
    body("items").isArray({ max: 500 }),
    body("items.*.productId").isInt({ min: 1 }),
    body("items.*.quantity").isInt({ min: 1 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    for (const item of req.body.items) {
      const [[product]] = await pool.query(
        "SELECT id,stock FROM products WHERE id=? AND status='active' AND stock>0",
        [item.productId],
      );
      if (!product) continue;
      const quantity = Math.min(Number(item.quantity), Number(product.stock));
      await pool.query(
        `INSERT INTO cart_items (user_id,product_id,quantity)
         VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE quantity=GREATEST(quantity,VALUES(quantity))`,
        [req.user.id, product.id, quantity],
      );
    }
    res.json({ message: "Panier synchronisé." });
  }),
);
app.get(
  "/api/shops",
  asyncRoute(async (_req, res) => {
    const [shops] = await pool.query(
      `SELECT u.id seller_id,COALESCE(sp.shop_name,u.name) shop_name,
        sp.shop_logo_url,
        sp.category,sp.description,
        (SELECT COUNT(*) FROM products WHERE seller_id=u.id AND status='active' AND stock>0) product_count,
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
        COALESCE(sp.shop_name,u.name) shop_name,sp.shop_logo_url,sp.whatsapp seller_whatsapp
       FROM products p
       JOIN categories c ON c.id=p.category_id
       JOIN users u ON u.id=p.seller_id
       LEFT JOIN seller_profiles sp ON sp.seller_id=p.seller_id
       WHERE p.id=? AND p.status='active' AND p.stock>0`,
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
    const uploadedImages = await storeImages(req.files, "products");
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
    const profileImageUrl = await storeImage(profileFile, "profiles");
    const shopLogoUrl = await storeImage(shopLogoFile, "shops");
    if (profileImageUrl) {
      await pool.query("UPDATE users SET profile_image_url=? WHERE id=?", [
        profileImageUrl,
        req.user.id,
      ]);
    }
    const [request] = await pool.query(
      "INSERT INTO seller_requests (user_id,business_name,shop_logo_url,description) VALUES (?,?,?,?)",
      [req.user.id, req.body.businessName, shopLogoUrl, req.body.description || null],
    );
    await notifyRole(
      pool,
      "supervisor",
      "seller_request.created",
      "Nouvelle demande vendeur",
      `${req.body.businessName} attend une vérification.`,
      "/supervisor/seller-requests",
      "seller_request",
      request.insertId,
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
    body("whatsapp").trim().isLength({ min: 8, max: 30 }),
    body("status").optional().isIn(["active", "paused"]),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const shopLogoFile = req.files?.shopLogo?.[0];
    const shopLogoUrl = await storeImage(shopLogoFile, "shops");
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
        dp.signer_name delivery_signer_name,
        dp.confirmed_at delivery_confirmed_at,
        u.name client_name,
        u.phone client_phone,
        p.status payment_status
      FROM seller_sales ss
      JOIN orders o ON o.id=ss.order_id
      JOIN users u ON u.id=o.client_id
      LEFT JOIN payments p ON p.order_id=o.id
      LEFT JOIN deliveries d ON d.order_id=o.id
      LEFT JOIN delivery_proofs dp ON dp.delivery_id=d.id
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
        `SELECT ss.*,p.status payment_status,o.client_id,o.order_number
         FROM seller_sales ss
         JOIN orders o ON o.id=ss.order_id
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
      if (req.body.status === "ready") {
        await notifyUser(
          connection,
          sale.client_id,
          "client",
          "order.ready",
          "Commande prête",
          `Une partie de la commande ${sale.order_number} est prête pour la livraison.`,
          "/my-orders",
          "order",
          sale.order_id,
        );
        await notifyRole(
          connection,
          "manager",
          "delivery.ready",
          "Commande prête à assigner",
          `La commande ${sale.order_number} peut être vérifiée pour livraison.`,
          "/manager/deliveries",
          "order",
          sale.order_id,
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
    body("promotionalPrice").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("isFeatured").optional().isBoolean(),
    body("offerEndsAt").optional({ checkFalsy: true }).isISO8601(),
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
      promotionalPrice: "promotional_price",
      isFeatured: "is_featured",
      offerEndsAt: "offer_ends_at",
      stock: "stock",
      imageUrl: "image_url",
      status: "status",
    };

    for (const [input, column] of Object.entries(mapping)) {
      if (req.body[input] !== undefined) {
        fields.push(`${column}=?`);
        values.push(
          ["promotionalPrice", "offerEndsAt"].includes(input) && !req.body[input]
            ? null
            : req.body[input],
        );
      }
    }
    if (
      req.body.promotionalPrice &&
      req.body.price &&
      Number(req.body.promotionalPrice) >= Number(req.body.price)
    ) {
      return res.status(422).json({
        message: "Le prix promotionnel doit être inférieur au prix normal.",
      });
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
    body("items.*.productId").isInt({ min: 1 }),
    body("items.*.quantity").isInt({ min: 1 }),
    body("deliveryAddress").trim().isLength({ min: 8 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const ids = req.body.items.map((item) => Number(item.productId));
      const [products] = await connection.query(
        `SELECT id,seller_id,
          CASE
            WHEN is_featured=TRUE
              AND promotional_price IS NOT NULL
              AND promotional_price < price
              AND (offer_ends_at IS NULL OR offer_ends_at > NOW())
            THEN promotional_price
            ELSE price
          END price,
          stock
         FROM products
         WHERE status='active' AND stock>0 AND id IN (${ids.map(() => "?").join(",")})
         FOR UPDATE`,
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
      await connection.query("DELETE FROM cart_items WHERE user_id=?", [req.user.id]);
      await notifyUser(
        connection,
        req.user.id,
        "client",
        "order.created",
        "Commande enregistrée",
        `Votre commande ${orderNumber} attend son paiement.`,
        "/my-orders",
        "order",
        order.insertId,
      );
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
  "/api/client/dashboard",
  authenticate,
  authorize("client"),
  asyncRoute(async (req, res) => {
    const [[stats]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM orders WHERE client_id=?) orders,
        (SELECT COUNT(*) FROM favorites WHERE user_id=?) favorites,
        (SELECT COALESCE(SUM(quantity),0) FROM cart_items WHERE user_id=?) cart_items`,
      [req.user.id, req.user.id, req.user.id],
    );
    const [[activeOrder]] = await pool.query(
      `SELECT o.id,o.order_number,o.total,o.status,o.created_at,
        p.status payment_status,d.status delivery_status,
        COUNT(oi.id) item_count,
        MIN(pr.image_url) image_url,
        GROUP_CONCAT(DISTINCT COALESCE(sp.shop_name,seller.name) ORDER BY seller.name SEPARATOR ', ') seller_names
       FROM orders o
       LEFT JOIN payments p ON p.order_id=o.id
       LEFT JOIN deliveries d ON d.order_id=o.id
       LEFT JOIN order_items oi ON oi.order_id=o.id
       LEFT JOIN products pr ON pr.id=oi.product_id
       LEFT JOIN users seller ON seller.id=oi.seller_id
       LEFT JOIN seller_profiles sp ON sp.seller_id=oi.seller_id
       WHERE o.client_id=? AND o.status NOT IN ('delivered','cancelled')
       GROUP BY o.id,p.status,d.status
       ORDER BY o.created_at DESC
       LIMIT 1`,
      [req.user.id],
    );
    const [activity] = await pool.query(
      `SELECT type,title,message,link,created_at
       FROM notifications
       WHERE user_id=? AND (role='client' OR role IS NULL)
       ORDER BY created_at DESC
       LIMIT 6`,
      [req.user.id],
    );
    const [[sellerRequest]] = await pool.query(
      `SELECT status,reviewed_at
       FROM seller_requests
       WHERE user_id=?
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id],
    );
    res.json({
      stats,
      activeOrder: activeOrder || null,
      activity,
      sellerRequest: sellerRequest || null,
    });
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
        const [sellers] = await connection.query(
          "SELECT DISTINCT seller_id FROM seller_sales WHERE order_id=?",
          [order.id],
        );
        await notifyUser(
          connection,
          req.user.id,
          "client",
          "payment.paid",
          "Paiement confirmé",
          `Le paiement de la commande ${order.order_number} est confirmé.`,
          "/my-orders",
          "order",
          order.id,
        );
        for (const seller of sellers) {
          await notifyUser(
            connection,
            seller.seller_id,
            "seller",
            "order.paid",
            "Nouvelle commande payée",
            `La commande ${order.order_number} peut être préparée.`,
            "/seller/orders",
            "order",
            order.id,
          );
        }
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
        SUM(status='assigned') awaiting_pickup,
        SUM(status='picked_up') ready_to_depart,
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
       ORDER BY
         CASE WHEN d.status IN ('assigned','picked_up','in_transit') THEN 0 ELSE 1 END,
         COALESCE(d.delivered_at,d.assigned_at) DESC
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
        dp.signer_name,
        dp.delivery_notes proof_notes,
        dp.confirmed_at proof_confirmed_at,
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
       LEFT JOIN delivery_proofs dp ON dp.delivery_id=d.id
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
  "/api/deliveries/:id/proof",
  authenticate,
  authorize("delivery"),
  asyncRoute(async (req, res) => {
    const [[proof]] = await pool.query(
      `SELECT dp.signer_name,dp.signature_data,dp.delivery_notes,dp.confirmed_at
       FROM deliveries d
       JOIN delivery_proofs dp ON dp.delivery_id=d.id
       WHERE d.id=? AND d.delivery_user_id=?`,
      [req.params.id, req.user.id],
    );
    res.json(proof || null);
  }),
);
app.get(
  "/api/deliveries/:id/items",
  authenticate,
  authorize("delivery"),
  asyncRoute(async (req, res) => {
    const [items] = await pool.query(
      `SELECT oi.product_id,oi.quantity,oi.unit_price,oi.subtotal,
        p.name product_name,p.image_url,
        COALESCE(sp.shop_name,seller.name) shop_name,
        sp.whatsapp shop_whatsapp
       FROM deliveries d
       JOIN order_items oi ON oi.order_id=d.order_id
       JOIN products p ON p.id=oi.product_id
       JOIN users seller ON seller.id=oi.seller_id
       LEFT JOIN seller_profiles sp ON sp.seller_id=seller.id
       WHERE d.id=? AND d.delivery_user_id=?
       ORDER BY shop_name,p.name`,
      [req.params.id, req.user.id],
    );
    res.json(items);
  }),
);
app.get(
  "/api/management/deliveries",
  authenticate,
  authorize("manager"),
  asyncRoute(async (_req, res) => {
    const [deliveries] = await pool.query(
      `SELECT d.*,o.order_number,o.delivery_address,u.name delivery_name
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
    const [[assigned]] = await pool.query(
      `SELECT d.order_id,o.order_number,o.client_id
       FROM deliveries d JOIN orders o ON o.id=d.order_id
       WHERE d.id=?`,
      [req.params.id],
    );
    await notifyUser(
      pool,
      driver.id,
      "delivery",
      "delivery.assigned",
      "Nouvelle mission assignée",
      `La livraison de la commande ${assigned.order_number} vous est assignée.`,
      "/delivery/assigned",
      "delivery",
      req.params.id,
    );
    await notifyUser(
      pool,
      assigned.client_id,
      "client",
      "delivery.assigned",
      "Livreur assigné",
      `Un livreur a été assigné à votre commande ${assigned.order_number}.`,
      "/my-orders",
      "order",
      assigned.order_id,
    );
    res.json({ message: "Livraison assignée." });
  }),
);
app.patch(
  "/api/deliveries/:id/status",
  authenticate,
  authorize("delivery"),
  [
    body("status").isIn(["picked_up", "in_transit", "delivered", "failed"]),
    body("signerName")
      .if(body("status").equals("delivered"))
      .trim()
      .isLength({ min: 2, max: 160 }),
    body("signatureData")
      .if(body("status").equals("delivered"))
      .isString()
      .isLength({ min: 100, max: 800000 }),
    body("notes").optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[delivery]] = await connection.query(
        `SELECT d.id,d.order_id,d.status,o.client_id,o.order_number,u.profile_image_url
         FROM deliveries d
         JOIN orders o ON o.id=d.order_id
         JOIN users u ON u.id=d.delivery_user_id
         WHERE d.id=? AND d.delivery_user_id=? FOR UPDATE`,
        [req.params.id, req.user.id],
      );
      if (!delivery) {
        await connection.rollback();
        return res.status(404).json({ message: "Livraison introuvable." });
      }
      if (!delivery.profile_image_url) {
        await connection.rollback();
        return res.status(409).json({
          message: "Ajoutez votre photo de profil avant de modifier une livraison.",
        });
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
      if (
        req.body.status === "delivered" &&
        !req.body.signatureData.startsWith("data:image/png;base64,")
      ) {
        await connection.rollback();
        return res.status(422).json({ message: "La signature client est invalide." });
      }
      await connection.query(
        "UPDATE deliveries SET status=?,delivered_at=IF(?='delivered',NOW(),delivered_at) WHERE id=?",
        [req.body.status, req.body.status, delivery.id],
      );
      if (req.body.status === "delivered") {
        await connection.query(
          `INSERT INTO delivery_proofs
            (delivery_id,signer_name,signature_data,delivery_notes)
           VALUES (?,?,?,?)
           ON DUPLICATE KEY UPDATE
            signer_name=VALUES(signer_name),
            signature_data=VALUES(signature_data),
            delivery_notes=VALUES(delivery_notes),
            confirmed_at=NOW()`,
          [
            delivery.id,
            req.body.signerName,
            req.body.signatureData,
            req.body.notes || null,
          ],
        );
        await connection.query("UPDATE orders SET status='delivered' WHERE id=?", [
          delivery.order_id,
        ]);
        await connection.query(
          "UPDATE seller_sales SET status='completed' WHERE order_id=? AND status='ready'",
          [delivery.order_id],
        );
        await notifyUser(
          connection,
          delivery.client_id,
          "client",
          "delivery.delivered",
          "Commande livrée",
          `La commande ${delivery.order_number} a été livrée et signée.`,
          "/my-orders",
          "order",
          delivery.order_id,
        );
        const [sellers] = await connection.query(
          "SELECT DISTINCT seller_id FROM seller_sales WHERE order_id=?",
          [delivery.order_id],
        );
        for (const seller of sellers) {
          await notifyUser(
            connection,
            seller.seller_id,
            "seller",
            "order.completed",
            "Commande finalisée",
            `La commande ${delivery.order_number} a été reçue par le client.`,
            "/seller/orders",
            "order",
            delivery.order_id,
          );
        }
      } else if (req.body.status === "in_transit") {
        await connection.query("UPDATE orders SET status='shipped' WHERE id=?", [
          delivery.order_id,
        ]);
        await notifyUser(
          connection,
          delivery.client_id,
          "client",
          "delivery.in_transit",
          "Commande en livraison",
          `Votre commande ${delivery.order_number} est en route.`,
          "/my-orders",
          "order",
          delivery.order_id,
        );
      } else if (req.body.status === "picked_up") {
        await notifyUser(
          connection,
          delivery.client_id,
          "client",
          "delivery.picked_up",
          "Commande récupérée",
          `Le livreur a récupéré votre commande ${delivery.order_number}.`,
          "/my-orders",
          "order",
          delivery.order_id,
        );
      } else if (req.body.status === "failed") {
        await notifyUser(
          connection,
          delivery.client_id,
          "client",
          "delivery.failed",
          "Incident de livraison",
          `La livraison de votre commande ${delivery.order_number} n’a pas pu être terminée.`,
          "/my-orders",
          "order",
          delivery.order_id,
        );
        await notifyRole(
          connection,
          "manager",
          "delivery.failed",
          "Livraison à traiter",
          `Un échec a été signalé pour la commande ${delivery.order_number}.`,
          "/manager/deliveries",
          "delivery",
          delivery.id,
        );
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
app.get(
  "/api/admin/seller-requests/:id",
  authenticate,
  authorize("supervisor"),
  noStore,
  asyncRoute(async (req, res) => {
    const [[request]] = await pool.query(
      `SELECT sr.*,u.name,u.email,u.phone,u.profile_image_url,u.status account_status,
        u.created_at account_created_at,reviewer.name reviewer_name
       FROM seller_requests sr
       JOIN users u ON u.id=sr.user_id
       LEFT JOIN users reviewer ON reviewer.id=sr.reviewed_by
       WHERE sr.id=?`,
      [req.params.id],
    );
    if (!request) return res.status(404).json({ message: "Demande vendeur introuvable." });
    const [roles] = await pool.query("SELECT role FROM user_roles WHERE user_id=? ORDER BY role", [
      request.user_id,
    ]);
    res.json({ ...request, roles: roles.map((item) => item.role) });
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
      await notifyUser(
        connection,
        request.user_id,
        "client",
        `seller_request.${req.body.status}`,
        req.body.status === "approved" ? "Demande vendeur approuvée" : "Demande vendeur refusée",
        req.body.status === "approved"
          ? "Votre espace vendeur est maintenant disponible."
          : req.body.reason,
        req.body.status === "approved" ? "/seller" : "/become-seller",
        "seller_request",
        request.id,
      );
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
  asyncRoute(async (req, res) => {
    const [[stats]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users) users,
        (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role='seller') sellers,
        (SELECT COUNT(*) FROM products WHERE status='active') products,
        (SELECT COUNT(*) FROM orders) orders,
        (SELECT COUNT(*) FROM seller_requests WHERE status='pending') pending_requests,
        (SELECT COUNT(*) FROM deliveries WHERE status IN ('assigned','picked_up','in_transit')) active_deliveries,
        (SELECT COUNT(*) FROM deliveries WHERE status='delivered') delivered,
        (SELECT COUNT(*) FROM deliveries WHERE status='failed') failed_deliveries`,
    );
    const isManager = req.user.roles.includes("manager");
    let sellerActivity = [];
    if (isManager) {
      [sellerActivity] = await pool.query(
        `SELECT u.id seller_id,COALESCE(sp.shop_name,u.name) seller_name,
          COUNT(DISTINCT p.id) active_products,
          COUNT(DISTINCT ss.order_id) orders,
          COUNT(DISTINCT CASE WHEN ss.status='completed' THEN ss.id END) completed_sales
         FROM users u
         JOIN user_roles ur ON ur.user_id=u.id AND ur.role='seller'
         LEFT JOIN seller_profiles sp ON sp.seller_id=u.id
         LEFT JOIN products p ON p.seller_id=u.id AND p.status='active'
         LEFT JOIN seller_sales ss ON ss.seller_id=u.id AND ss.status!='cancelled'
         GROUP BY u.id,sp.shop_name,u.name
         ORDER BY orders DESC,active_products DESC
         LIMIT 10`,
      );
    }
    const [deliveryHealth] = await pool.query(
      "SELECT status,COUNT(*) total FROM deliveries GROUP BY status ORDER BY total DESC",
    );
    const [requestHealth] = await pool.query(
      "SELECT status,COUNT(*) total FROM seller_requests GROUP BY status ORDER BY total DESC",
    );
    res.json({
      stats,
      deliveryHealth,
      requestHealth,
      ...(isManager ? { sellerActivity } : {}),
    });
  }),
);
app.get(
  "/api/admin/weekly-report",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (req, res) => {
    if (req.query.ending && !/^\d{4}-\d{2}-\d{2}$/.test(req.query.ending)) {
      return res.status(422).json({ message: "Date de fin invalide." });
    }
    const report = await getWeeklyMerchantReport(req.query.ending);
    res.json({
      period: report.period,
      totals: report.totals,
      merchants: report.merchants.map(({ items, ...merchant }) => ({
        ...merchant,
        item_count: items.reduce((total, item) => total + Number(item.quantity || 0), 0),
      })),
    });
  }),
);
app.get(
  "/api/admin/weekly-report.pdf",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (req, res) => {
    if (req.query.ending && !/^\d{4}-\d{2}-\d{2}$/.test(req.query.ending)) {
      return res.status(422).json({ message: "Date de fin invalide." });
    }
    const report = await getWeeklyMerchantReport(req.query.ending);
    const filename = `rapport-vinnht-${report.period.start}-au-${report.period.end}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    buildWeeklyReportPdf(res, report);
  }),
);
app.get(
  "/api/admin/users",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (req, res) => {
    const query = String(req.query.q || "").trim();
    const status = ["active", "suspended"].includes(req.query.status)
      ? req.query.status
      : null;
    const searching = query.length >= 2;
    const searchValue = `%${query}%`;
    const [rows] = await pool.query(
      `SELECT u.id,u.name,u.email,u.phone,u.role,u.status,u.created_at,
        GROUP_CONCAT(ur.role ORDER BY ur.role) roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id=u.id
       WHERE (? IS NULL OR u.status=?)
         AND (
           (?=0 AND EXISTS(
             SELECT 1 FROM user_roles seller_role
             WHERE seller_role.user_id=u.id AND seller_role.role='seller'
           ))
           OR
           (?=1 AND (
             u.name LIKE ? OR u.email LIKE ? OR COALESCE(u.phone,'') LIKE ?
           ))
         )
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      [
        status,
        status,
        searching ? 1 : 0,
        searching ? 1 : 0,
        searchValue,
        searchValue,
        searchValue,
      ],
    );
    res.json(rows.map((row) => ({ ...row, roles: row.roles ? row.roles.split(",") : [row.role] })));
  }),
);
app.post(
  "/api/admin/staff",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  [
    body("name").trim().isLength({ min: 2, max: 120 }),
    body("email").isEmail().normalizeEmail(),
    body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
    body("password").isLength({ min: 10, max: 128 }),
    body("role").isIn(["manager", "supervisor"]),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO users (name,email,phone,password_hash,role,status)
         VALUES (?,?,?,?,?,'active')`,
        [
          req.body.name,
          req.body.email,
          req.body.phone || null,
          passwordHash,
          req.body.role,
        ],
      );
      await connection.query(
        "INSERT INTO user_roles (user_id,role) VALUES (?,?)",
        [result.insertId, req.body.role],
      );
      await connection.commit();
      await audit(req, "staff.create", "user", result.insertId, { role: req.body.role });
      res.status(201).json({
        id: result.insertId,
        message: `${req.body.role === "manager" ? "Manager" : "Superviseur"} créé avec succès.`,
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
  "/api/admin/dashboard",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (_req, res) => {
    const [[stats]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users) users,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at)=CURRENT_DATE) users_today,
        (SELECT COUNT(*) FROM users WHERE status='suspended') suspended_users,
        (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role='seller') sellers,
        (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role='delivery') delivery_users,
        (SELECT COUNT(*) FROM products WHERE status='active') active_products,
        (SELECT COUNT(*) FROM products WHERE status='active' AND stock=0) out_of_stock_products,
        (SELECT COUNT(*) FROM orders) orders,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at)=CURRENT_DATE) orders_today,
        (SELECT COUNT(*) FROM seller_requests WHERE status='pending') pending_seller_requests,
        (SELECT COUNT(*) FROM deliveries WHERE status IN ('unassigned','assigned','picked_up','in_transit')) active_deliveries,
        (SELECT COUNT(*) FROM deliveries WHERE status='unassigned') unassigned_deliveries,
        (SELECT COUNT(*) FROM deliveries WHERE status='failed') failed_deliveries,
        (SELECT COUNT(*) FROM payments WHERE status='pending') pending_payments,
        (SELECT COUNT(*) FROM payments WHERE status='failed') failed_payments,
        (SELECT COUNT(*) FROM payouts WHERE status='pending') pending_payouts,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid') paid_volume,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid' AND DATE(COALESCE(paid_at,created_at))=CURRENT_DATE) paid_today`,
    );
    const [dailySales] = await pool.query(
      `SELECT DATE(COALESCE(paid_at,created_at)) sale_date,COUNT(*) payments,COALESCE(SUM(amount),0) total
       FROM payments
       WHERE status='paid' AND COALESCE(paid_at,created_at) >= DATE_SUB(CURRENT_DATE,INTERVAL 6 DAY)
       GROUP BY DATE(COALESCE(paid_at,created_at))
       ORDER BY sale_date`,
    );
    const [paymentHealth] = await pool.query(
      `SELECT status,COUNT(*) total,COALESCE(SUM(amount),0) amount
       FROM payments
       GROUP BY status`,
    );
    const [deliveryHealth] = await pool.query(
      `SELECT status,COUNT(*) total
       FROM deliveries
       GROUP BY status`,
    );
    const [recentAudit] = await pool.query(
      `SELECT al.id,al.action,al.entity_type,al.entity_id,al.created_at,u.name actor_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id=al.actor_user_id
       ORDER BY al.created_at DESC
       LIMIT 8`,
    );
    res.json({
      stats,
      dailySales,
      paymentHealth,
      deliveryHealth,
      recentAudit,
    });
  }),
);
app.patch(
  "/api/admin/users/:id/status",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  [body("status").isIn(["active", "suspended"])],
  validate,
  asyncRoute(async (req, res) => {
    const userId = Number(req.params.id);
    if (userId === req.user.id && req.body.status === "suspended") {
      return res.status(409).json({ message: "Vous ne pouvez pas suspendre votre propre compte." });
    }
    if (req.body.status === "suspended") {
      const [[target]] = await pool.query(
        `SELECT EXISTS(
          SELECT 1 FROM user_roles WHERE user_id=? AND role='admin'
        ) is_admin`,
        [userId],
      );
      if (target?.is_admin) {
        const [[adminCount]] = await pool.query(
          `SELECT COUNT(DISTINCT u.id) total
           FROM users u
           JOIN user_roles ur ON ur.user_id=u.id AND ur.role='admin'
           WHERE u.status='active'`,
        );
        if (Number(adminCount.total) <= 1) {
          return res.status(409).json({
            message: "Le dernier administrateur actif ne peut pas être suspendu.",
          });
        }
      }
    }
    const [result] = await pool.query("UPDATE users SET status=? WHERE id=?", [
      req.body.status,
      userId,
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: "Utilisateur introuvable." });
    await audit(req, "user.status.update", "user", userId, { status: req.body.status });
    res.json({ message: "Statut utilisateur mis à jour." });
  }),
);
app.patch(
  "/api/admin/users/:id/roles",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  [
    body("roles")
      .isArray({ min: 1 })
      .custom((roles) =>
        roles.every((role) =>
          ["client", "seller", "delivery", "supervisor", "manager", "admin"].includes(role),
        ),
      ),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const userId = Number(req.params.id);
    const roles = [...new Set(req.body.roles)];
    if (userId === req.user.id && !roles.includes("admin")) {
      return res.status(409).json({ message: "Vous ne pouvez pas retirer votre propre rôle admin." });
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[user]] = await connection.query("SELECT id FROM users WHERE id=? FOR UPDATE", [userId]);
      if (!user) {
        await connection.rollback();
        return res.status(404).json({ message: "Utilisateur introuvable." });
      }
      const [[currentAdminRole]] = await connection.query(
        "SELECT COUNT(*) total FROM user_roles WHERE user_id=? AND role='admin'",
        [userId],
      );
      if (Number(currentAdminRole.total) > 0 && !roles.includes("admin")) {
        const [[adminCount]] = await connection.query(
          `SELECT COUNT(DISTINCT u.id) total
           FROM users u
           JOIN user_roles ur ON ur.user_id=u.id AND ur.role='admin'
           WHERE u.status='active'`,
        );
        if (Number(adminCount.total) <= 1) {
          await connection.rollback();
          return res.status(409).json({
            message: "Le rôle du dernier administrateur actif ne peut pas être retiré.",
          });
        }
      }
      await connection.query("DELETE FROM user_roles WHERE user_id=?", [userId]);
      for (const role of roles) {
        await connection.query("INSERT INTO user_roles (user_id,role) VALUES (?,?)", [userId, role]);
      }
      const primaryRole =
        ["admin", "manager", "supervisor", "delivery", "seller", "client"].find((role) =>
          roles.includes(role),
        ) || "client";
      await connection.query("UPDATE users SET role=? WHERE id=?", [primaryRole, userId]);
      await connection.commit();
      await audit(req, "user.roles.update", "user", userId, { roles });
      res.json({ message: "Rôles utilisateur mis à jour.", roles, role: primaryRole });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);
app.post(
  "/api/admin/categories",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  [
    body("name").trim().isLength({ min: 2, max: 120 }),
    body("slug").trim().matches(/^[a-z0-9-]+$/).isLength({ min: 2, max: 140 }),
    body("icon").optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const [result] = await pool.query(
      "INSERT INTO categories (name,slug,icon) VALUES (?,?,?)",
      [req.body.name, req.body.slug, req.body.icon || null],
    );
    await audit(req, "category.create", "category", result.insertId, req.body);
    res.status(201).json({ id: result.insertId, message: "Catégorie créée." });
  }),
);
app.get(
  "/api/admin/categories",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT
        c.id,c.name,c.slug,c.icon,
        COUNT(p.id) product_count,
        SUM(p.status='active') active_product_count,
        SUM(p.status='active' AND p.stock=0) out_of_stock_count,
        COALESCE(SUM(CASE WHEN p.status='active' THEN p.stock ELSE 0 END),0) total_stock
       FROM categories c
       LEFT JOIN products p ON p.category_id=c.id
       GROUP BY c.id
       ORDER BY c.name`,
    );
    res.json(rows);
  }),
);
app.patch(
  "/api/admin/categories/:id",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  [
    body("name").trim().isLength({ min: 2, max: 120 }),
    body("slug").trim().matches(/^[a-z0-9-]+$/).isLength({ min: 2, max: 140 }),
    body("icon").optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const [result] = await pool.query(
      "UPDATE categories SET name=?,slug=?,icon=? WHERE id=?",
      [req.body.name, req.body.slug, req.body.icon || null, req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Catégorie introuvable." });
    await audit(req, "category.update", "category", req.params.id, req.body);
    res.json({ message: "Catégorie mise à jour." });
  }),
);
app.delete(
  "/api/admin/categories/:id",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  asyncRoute(async (req, res) => {
    const [[category]] = await pool.query(
      `SELECT c.id,c.name,COUNT(p.id) product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id=c.id
       WHERE c.id=?
       GROUP BY c.id`,
      [req.params.id],
    );
    if (!category) return res.status(404).json({ message: "Catégorie introuvable." });
    if (Number(category.product_count) > 0) {
      return res.status(409).json({
        message: "Cette catégorie contient des produits et ne peut pas être supprimée.",
      });
    }
    await pool.query("DELETE FROM categories WHERE id=?", [category.id]);
    await audit(req, "category.delete", "category", category.id, { name: category.name });
    res.json({ message: "Catégorie vide supprimée." });
  }),
);
app.get(
  "/api/admin/products",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT p.id,p.seller_id,p.name,p.price,p.promotional_price,p.stock,p.status,p.is_featured,p.image_url,p.created_at,
        c.name category_name,COALESCE(sp.shop_name,u.name) seller_name
       FROM products p
       JOIN categories c ON c.id=p.category_id
       JOIN users u ON u.id=p.seller_id
       LEFT JOIN seller_profiles sp ON sp.seller_id=p.seller_id
       ORDER BY p.created_at DESC
       LIMIT 500`,
    );
    res.json(rows);
  }),
);
app.post(
  "/api/admin/sellers/:id/sponsorship",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  [
    body("amount").isFloat({ min: 0 }),
    body("startsAt").isISO8601(),
    body("endsAt").isISO8601(),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const [[seller]] = await pool.query(
      `SELECT u.id,COALESCE(sp.shop_name,u.name) seller_name
       FROM users u
       JOIN user_roles ur ON ur.user_id=u.id AND ur.role='seller'
       LEFT JOIN products p ON p.seller_id=u.id
       LEFT JOIN seller_profiles sp ON sp.seller_id=u.id
       WHERE u.id=?
       GROUP BY u.id,sp.shop_name`,
      [req.params.id],
    );
    if (!seller) return res.status(404).json({ message: "Vendeur introuvable." });
    if (new Date(req.body.endsAt) <= new Date(req.body.startsAt)) {
      return res.status(422).json({ message: "La date de fin doit suivre la date de debut." });
    }
    await pool.query(
      "UPDATE seller_sponsorships SET status='expired' WHERE seller_id=? AND status IN ('pending','active')",
      [seller.id],
    );
    const [result] = await pool.query(
      `INSERT INTO seller_sponsorships (seller_id,amount,status,starts_at,ends_at)
       VALUES (?,?,'active',?,?)`,
      [seller.id, req.body.amount, req.body.startsAt, req.body.endsAt],
    );
    await audit(req, "seller.sponsorship.activate", "seller", seller.id, req.body);
    res.status(201).json({
      id: result.insertId,
      message: `Campagne activee pour ${seller.seller_name}. Ses produits pertinents seront prioritaires.`,
    });
  }),
);
app.get(
  "/api/admin/seller-sponsorships",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT u.id seller_id,COALESCE(sp.shop_name,u.name) seller_name,sp.shop_logo_url logo_url,
        COUNT(p.id) product_count,
        SUM(CASE WHEN p.status='active' AND p.stock>0 THEN 1 ELSE 0 END) active_product_count,
        ss.id sponsorship_id,ss.amount sponsorship_amount,ss.status sponsorship_status,
        ss.starts_at sponsorship_starts_at,ss.ends_at sponsorship_ends_at
       FROM users u
       JOIN user_roles ur ON ur.user_id=u.id AND ur.role='seller'
       LEFT JOIN products p ON p.seller_id=u.id
       LEFT JOIN seller_profiles sp ON sp.seller_id=u.id
       LEFT JOIN seller_sponsorships ss ON ss.id=(
         SELECT latest_ss.id FROM seller_sponsorships latest_ss
         WHERE latest_ss.seller_id=u.id
         ORDER BY latest_ss.created_at DESC LIMIT 1
       )
       GROUP BY u.id,sp.shop_name,sp.shop_logo_url,ss.id
       ORDER BY sponsorship_status='active' DESC,active_product_count DESC,seller_name`,
    );
    res.json(rows);
  }),
);
app.patch(
  "/api/admin/sellers/:id/sponsorship/cancel",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  asyncRoute(async (req, res) => {
    await pool.query(
      "UPDATE seller_sponsorships SET status='cancelled' WHERE seller_id=? AND status='active'",
      [req.params.id],
    );
    await audit(req, "seller.sponsorship.cancel", "seller", req.params.id);
    res.json({ message: "Campagne vendeur annulee." });
  }),
);
app.post(
  "/api/admin/products/:id/sponsorship",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  [
    body("keyword").trim().isLength({ min: 2, max: 120 }),
    body("amount").isFloat({ min: 0 }),
    body("startsAt").isISO8601(),
    body("endsAt").isISO8601(),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const [[product]] = await pool.query("SELECT id,seller_id,name FROM products WHERE id=?", [
      req.params.id,
    ]);
    if (!product) return res.status(404).json({ message: "Produit introuvable." });
    if (new Date(req.body.endsAt) <= new Date(req.body.startsAt)) {
      return res.status(422).json({ message: "La date de fin doit suivre la date de début." });
    }
    await pool.query(
      `UPDATE product_sponsorships
       SET status='expired'
       WHERE product_id=? AND status='active'`,
      [product.id],
    );
    const [result] = await pool.query(
      `INSERT INTO product_sponsorships
        (product_id,seller_id,keyword,amount,status,starts_at,ends_at)
       VALUES (?,?,?,?,'active',?,?)`,
      [
        product.id,
        product.seller_id,
        req.body.keyword.toLowerCase(),
        req.body.amount,
        req.body.startsAt,
        req.body.endsAt,
      ],
    );
    await audit(req, "product.sponsorship.activate", "product", product.id, req.body);
    res.status(201).json({
      id: result.insertId,
      message: "Placement sponsorisé activé. Ce produit sera prioritaire pour ce mot-clé.",
    });
  }),
);
app.patch(
  "/api/admin/products/:id/sponsorship/cancel",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  asyncRoute(async (req, res) => {
    await pool.query(
      "UPDATE product_sponsorships SET status='cancelled' WHERE product_id=? AND status='active'",
      [req.params.id],
    );
    await audit(req, "product.sponsorship.cancel", "product", req.params.id);
    res.json({ message: "Placement sponsorisé annulé." });
  }),
);
app.patch(
  "/api/admin/products/:id/status",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  [body("status").isIn(["draft", "active", "inactive"])],
  validate,
  asyncRoute(async (req, res) => {
    const [result] = await pool.query("UPDATE products SET status=? WHERE id=?", [
      req.body.status,
      req.params.id,
    ]);
    if (!result.affectedRows) return res.status(404).json({ message: "Produit introuvable." });
    await audit(req, "product.status.update", "product", req.params.id, req.body);
    res.json({ message: "Statut produit mis à jour." });
  }),
);
app.get(
  "/api/admin/orders",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT o.id,o.order_number,o.total,o.status,o.delivery_address,o.created_at,
        u.name client_name,u.email client_email,p.status payment_status,d.status delivery_status
       FROM orders o
       JOIN users u ON u.id=o.client_id
       LEFT JOIN payments p ON p.order_id=o.id
       LEFT JOIN deliveries d ON d.order_id=o.id
       ORDER BY o.created_at DESC
       LIMIT 500`,
    );
    res.json(rows);
  }),
);
app.get(
  "/api/admin/payments",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT p.*,o.order_number,u.name client_name
       FROM payments p
       JOIN orders o ON o.id=p.order_id
       JOIN users u ON u.id=o.client_id
       ORDER BY p.created_at DESC
       LIMIT 500`,
    );
    res.json(rows);
  }),
);
app.get(
  "/api/admin/payment-center",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (_req, res) => {
    const [[stats]] = await pool.query(
      `SELECT
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid') collected,
        (SELECT COUNT(*) FROM payments WHERE status='pending') pending_count,
        (SELECT COUNT(*) FROM payments WHERE status='failed') failed_count,
        (SELECT COALESCE(SUM(amount),0) FROM payouts WHERE status='pending') seller_due`,
    );
    const [batches] = await pool.query(
      `SELECT pb.*,COUNT(pbi.id) seller_count
       FROM payout_batches pb
       LEFT JOIN payout_batch_items pbi ON pbi.batch_id=pb.id
       GROUP BY pb.id
       ORDER BY pb.scheduled_for DESC
       LIMIT 20`,
    );
    res.json({ stats, batches });
  }),
);
app.get(
  "/api/admin/payout-batches/:id",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (req, res) => {
    const [[batch]] = await pool.query("SELECT * FROM payout_batches WHERE id=?", [req.params.id]);
    if (!batch) return res.status(404).json({ message: "Lot introuvable." });
    const [items] = await pool.query(
      `SELECT pbi.*,COALESCE(sp.shop_name,u.name) seller_name,u.email
       FROM payout_batch_items pbi
       JOIN users u ON u.id=pbi.seller_id
       LEFT JOIN seller_profiles sp ON sp.seller_id=pbi.seller_id
       WHERE pbi.batch_id=?
       ORDER BY pbi.amount DESC`,
      [batch.id],
    );
    res.json({ batch, items });
  }),
);
app.post(
  "/api/admin/payout-batches/prepare",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  [body("sunday").optional({ checkFalsy: true }).isISO8601()],
  validate,
  asyncRoute(async (req, res) => {
    const batch = await prepareWeeklyPayoutBatch(req.body.sunday || new Date());
    res.json({ message: "Lot de paiements vendeurs préparé.", batch });
  }),
);
app.patch(
  "/api/admin/payout-batches/:id/paid",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  asyncRoute(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [[batch]] = await connection.query(
        "SELECT * FROM payout_batches WHERE id=? FOR UPDATE",
        [req.params.id],
      );
      if (!batch) {
        await connection.rollback();
        return res.status(404).json({ message: "Lot introuvable." });
      }
      await connection.query(
        "UPDATE payout_batches SET status='paid',paid_at=NOW() WHERE id=?",
        [batch.id],
      );
      await connection.query(
        "UPDATE payout_batch_items SET status='paid',paid_at=NOW() WHERE batch_id=?",
        [batch.id],
      );
      const [items] = await connection.query(
        "SELECT seller_id,amount FROM payout_batch_items WHERE batch_id=?",
        [batch.id],
      );
      for (const item of items) {
        await notifyUser(
          connection,
          item.seller_id,
          "seller",
          "payout.weekly.paid",
          "Paiement hebdomadaire confirmé",
          `Votre paiement hebdomadaire de ${pdfMoney(item.amount)} a été confirmé.`,
          "/seller/payouts",
          "payout_batch",
          batch.id,
        );
      }
      await connection.commit();
      await audit(req, "payout_batch.paid", "payout_batch", batch.id);
      res.json({ message: "Paiements vendeurs confirmés pour ce lot." });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }),
);
app.get(
  "/api/admin/payouts",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT po.*,u.name seller_name,o.order_number
       FROM payouts po
       JOIN users u ON u.id=po.seller_id
       JOIN seller_sales ss ON ss.id=po.seller_sale_id
       JOIN orders o ON o.id=ss.order_id
       ORDER BY po.created_at DESC
       LIMIT 500`,
    );
    res.json(rows);
  }),
);
app.get(
  "/api/admin/audit-logs",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT al.*,u.name actor_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id=al.actor_user_id
       ORDER BY al.created_at DESC
       LIMIT 200`,
    );
    res.json(rows);
  }),
);
app.get(
  "/api/admin/contact-requests",
  authenticate,
  authorize("admin"),
  noStore,
  asyncRoute(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT id,name,email,subject,message,status,created_at
       FROM contact_requests
       ORDER BY FIELD(status,'new','in_progress','resolved'),created_at DESC
       LIMIT 300`,
    );
    res.json(rows);
  }),
);
app.patch(
  "/api/admin/contact-requests/:id",
  authenticate,
  authorize("admin"),
  writeRateLimiter,
  [body("status").isIn(["new", "in_progress", "resolved"])],
  validate,
  asyncRoute(async (req, res) => {
    const [result] = await pool.query(
      "UPDATE contact_requests SET status=? WHERE id=?",
      [req.body.status, req.params.id],
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Demande de support introuvable." });
    }
    res.json({ message: "Statut de la demande mis à jour." });
  }),
);
app.get(
  "/api/notifications",
  authenticate,
  asyncRoute(async (req, res) => {
    const role = req.query.role;
    if (role && !req.user.roles.includes(role) && !req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Rôle de notification non autorisé." });
    }
    const [rows] = await pool.query(
      `SELECT id,role,type,title,message,link,entity_type,entity_id,read_at,created_at
       FROM notifications
       WHERE user_id=? AND (? IS NULL OR role=? OR role IS NULL)
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id, role || null, role || null],
    );
    res.json(rows);
  }),
);
app.patch(
  "/api/notifications/:id/read",
  authenticate,
  writeRateLimiter,
  asyncRoute(async (req, res) => {
    const [result] = await pool.query(
      "UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=? AND user_id=?",
      [req.params.id, req.user.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Notification introuvable." });
    res.json({ message: "Notification lue." });
  }),
);
app.patch(
  "/api/notifications/read-all",
  authenticate,
  writeRateLimiter,
  [body("role").optional({ checkFalsy: true }).isIn(["client", "seller", "delivery", "supervisor", "manager", "admin"])],
  validate,
  asyncRoute(async (req, res) => {
    const role = req.body.role || null;
    if (role && !req.user.roles.includes(role) && !req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Rôle de notification non autorisé." });
    }
    await pool.query(
      `UPDATE notifications SET read_at=COALESCE(read_at,NOW())
       WHERE user_id=? AND (? IS NULL OR role=? OR role IS NULL)`,
      [req.user.id, role, role],
    );
    res.json({ message: "Toutes les notifications sont lues." });
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
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Cette valeur existe déjà." });
  }
  if (error.code === "LIMIT_FILE_SIZE" || error.code === "LIMIT_FILE_COUNT") {
    return res.status(413).json({ message: "Le fichier envoyé dépasse la limite autorisée." });
  }
  if (error.message === "Origine non autorisée.") {
    return res.status(403).json({ message: error.message });
  }
  res
    .status(error.status || 500)
    .json({
      message: error.status
        ? error.message
        : "Une erreur interne est survenue.",
    });
});

const publishSaturdayReportNotification = async () => {
  const now = new Date();
  if (now.getDay() !== 6) return;
  const period = reportPeriod(sqlDate(now));
  await pool.query(
    `INSERT INTO notifications
      (user_id,role,type,title,message,link,entity_type,entity_id)
     SELECT
      u.id,'admin','weekly_report.ready','Rapport hebdomadaire disponible',
      ?,'/admin#weekly-report','weekly_report',?
     FROM users u
     JOIN user_roles ur ON ur.user_id=u.id AND ur.role='admin'
     WHERE u.status='active'
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id=u.id
           AND n.type='weekly_report.ready'
           AND n.entity_type='weekly_report'
           AND n.entity_id=?
       )`,
    [
      `Le rapport des marchands du ${period.start} au ${period.end} est prêt au téléchargement.`,
      period.end,
      period.end,
    ],
  );
};
const prepareSundaySellerPayments = async () => {
  const now = new Date();
  if (now.getDay() !== 0) return;
  const batch = await prepareWeeklyPayoutBatch(now);
  const [[existing]] = await pool.query(
    "SELECT COUNT(*) total FROM notifications WHERE type='payout_batch.ready' AND entity_type='payout_batch' AND entity_id=?",
    [batch.id],
  );
  if (!Number(existing.total)) {
    await notifyRole(
      pool,
      "admin",
      "payout_batch.ready",
      "Paiements vendeurs du dimanche",
      `Le lot de paiements vendeurs de ${pdfMoney(batch.total_amount)} est prêt à être vérifié.`,
      "/admin/payments",
      "payout_batch",
      batch.id,
    );
  }
};

const port = Number(process.env.PORT || 5056);
const sslEnabled = Boolean(process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH);
const server = sslEnabled
  ? https.createServer(
      {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH),
      },
      app,
    )
  : app;

server.listen(port, () => {
  const protocol = sslEnabled ? "https" : "http";
  console.log(`VinnHT API disponible sur ${protocol}://localhost:${port}`);
  publishSaturdayReportNotification().catch(console.error);
  prepareSundaySellerPayments().catch(console.error);
  const saturdayReportTimer = setInterval(
    () => {
      publishSaturdayReportNotification().catch(console.error);
      prepareSundaySellerPayments().catch(console.error);
    },
    60 * 60 * 1000,
  );
  saturdayReportTimer.unref();
});
