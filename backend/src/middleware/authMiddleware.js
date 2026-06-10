import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentification requise." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT role FROM user_roles WHERE user_id=? ORDER BY role",
      [payload.id],
    );
    req.user = {
      ...payload,
      roles: rows.length ? rows.map((row) => row.role) : [payload.role],
    };
    next();
  } catch {
    res.status(401).json({ message: "Session invalide ou expirée." });
  }
}
