import jwt from "jsonwebtoken";
import pool from "../config/database.js";

const cookieValue = (header = "", name) =>
  header
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];

const requestToken = (req) =>
    req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
    cookieValue(req.headers.cookie, "vinnht_session");

const authenticatedUser = async (token) => {
  const payload = jwt.verify(token, process.env.JWT_SECRET, {
    issuer: "vinnht-api",
    audience: "vinnht-web",
  });

  const [[account]] = await pool.query(
    "SELECT id,name,email,role,status FROM users WHERE id=?",
    [payload.id],
  );

  if (!account || account.status !== "active") return null;

  const [rows] = await pool.query(
    "SELECT role FROM user_roles WHERE user_id=? ORDER BY role",
    [payload.id],
  );

  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    roles: rows.length ? rows.map((row) => row.role) : [account.role],
  };
};

export async function authenticate(req, res, next) {
  const token = requestToken(req);
  if (!token) return res.status(401).json({ message: "Authentification requise." });

  try {
    res.set("Cache-Control", "no-store");
    req.user = await authenticatedUser(token);
    if (!req.user) {
      return res.status(401).json({ message: "Ce compte est indisponible ou suspendu." });
    }
    next();
  } catch {
    res.status(401).json({ message: "Session invalide ou expiree." });
  }
}

export async function optionalAuthenticate(req, res, next) {
  const token = requestToken(req);
  res.set("Cache-Control", "no-store");
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = await authenticatedUser(token);
  } catch {
    req.user = null;
  }
  next();
}
