import jwt from "jsonwebtoken";
import pool from "../config/database.js";

const cookieValue = (header = "", name) =>
  header
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];

export async function authenticate(req, res, next) {
  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
    cookieValue(req.headers.cookie, "vinnht_session");
  if (!token) return res.status(401).json({ message: "Authentification requise." });

  try {
    res.set("Cache-Control", "no-store");
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "vinnht-api",
      audience: "vinnht-web",
    });
    const [[account]] = await pool.query(
      "SELECT id,name,email,role,status FROM users WHERE id=?",
      [payload.id],
    );
    if (!account || account.status !== "active") {
      return res.status(401).json({ message: "Ce compte est indisponible ou suspendu." });
    }
    const [rows] = await pool.query(
      "SELECT role FROM user_roles WHERE user_id=? ORDER BY role",
      [payload.id],
    );
    req.user = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      roles: rows.length ? rows.map((row) => row.role) : [account.role],
    };
    next();
  } catch {
    res.status(401).json({ message: "Session invalide ou expirée." });
  }
}
