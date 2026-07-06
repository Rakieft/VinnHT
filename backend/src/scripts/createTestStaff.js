import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";

const accounts = [
  {
    name: "Manager Opérations 01",
    email: "manager01@vinnht.test",
    phone: "39010001",
    password: "VinnHT-Manager01!2026",
    role: "manager",
  },
  {
    name: "Manager Opérations 02",
    email: "manager02@vinnht.test",
    phone: "39010002",
    password: "VinnHT-Manager02!2026",
    role: "manager",
  },
  {
    name: "Support VinnHT 01",
    email: "support01@vinnht.test",
    phone: "39020001",
    password: "VinnHT-Support01!2026",
    role: "support",
  },
  {
    name: "Support VinnHT 02",
    email: "support02@vinnht.test",
    phone: "39020002",
    password: "VinnHT-Support02!2026",
    role: "support",
  },
  {
    name: "Finance VinnHT 01",
    email: "finance01@vinnht.test",
    phone: "39030001",
    password: "VinnHT-Finance01!2026",
    role: "finance",
  },
  {
    name: "Finance VinnHT 02",
    email: "finance02@vinnht.test",
    phone: "39030002",
    password: "VinnHT-Finance02!2026",
    role: "finance",
  },
];

const connection = await pool.getConnection();

try {
  await connection.beginTransaction();

  for (const account of accounts) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    await connection.query(
      `INSERT INTO users (name,email,phone,password_hash,role,status)
       VALUES (?,?,?,?,?,'active')
       ON DUPLICATE KEY UPDATE
         name=VALUES(name),phone=VALUES(phone),password_hash=VALUES(password_hash),
         role=VALUES(role),status='active'`,
      [
        account.name,
        account.email,
        account.phone,
        passwordHash,
        account.role,
      ],
    );

    const [[user]] = await connection.query(
      "SELECT id FROM users WHERE email=?",
      [account.email],
    );
    await connection.query("DELETE FROM user_roles WHERE user_id=?", [user.id]);
    await connection.query(
      "INSERT INTO user_roles (user_id,role) VALUES (?,?)",
      [user.id, account.role],
    );
  }

  await connection.commit();

  const emails = accounts.map((account) => account.email);
  const placeholders = emails.map(() => "?").join(",");
  const [created] = await pool.query(
    `SELECT u.email,u.role,u.status,GROUP_CONCAT(ur.role ORDER BY ur.role) roles
     FROM users u
     JOIN user_roles ur ON ur.user_id=u.id
     WHERE u.email IN (${placeholders})
     GROUP BY u.id,u.email,u.role,u.status
     ORDER BY u.role,u.email`,
    emails,
  );

  if (created.length !== accounts.length) {
    throw new Error("Tous les comptes staff de test n’ont pas été créés.");
  }

  for (const account of accounts) {
    const createdAccount = created.find((item) => item.email === account.email);
    if (!createdAccount || createdAccount.role !== account.role) {
      throw new Error(`Rôle incorrect pour ${account.email}.`);
    }
  }

  console.log("6 comptes staff de test créés et vérifiés.");
} catch (error) {
  await connection.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
