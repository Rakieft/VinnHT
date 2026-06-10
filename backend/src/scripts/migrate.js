import "dotenv/config";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dbName = process.env.DB_NAME || "vinnht";
let connection;

try {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.changeUser({ database: dbName });
  const migrationsDirectory = fileURLToPath(new URL("../migrations", import.meta.url));
  const migrations = (await fs.readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const migration of migrations) {
    const sql = await fs.readFile(path.join(migrationsDirectory, migration), "utf8");
    try {
      await connection.query(sql);
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") throw error;
    }
  }
  console.log(`Base de données "${dbName}" prête.`);
} catch (error) {
  if (error.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("\nConnexion MySQL refusée.");
    console.error("Ouvrez backend/.env et renseignez les bons identifiants MySQL :");
    console.error("  DB_USER=root");
    console.error("  DB_PASSWORD=votre_mot_de_passe_mysql");
    console.error("\nVotre service MySQL tourne, mais le compte root n'accepte pas une connexion sans mot de passe.");
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
} finally {
  if (connection) await connection.end();
}
