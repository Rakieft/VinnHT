import "dotenv/config";
import fs from "node:fs/promises";
import pool from "../config/database.js";

const filename = process.argv[2];
if (!filename) {
  console.error("Utilisation : npm run db:restore -- chemin/vers/sauvegarde.json");
  process.exit(1);
}

const backup = JSON.parse(await fs.readFile(filename, "utf8"));
const connection = await pool.getConnection();

try {
  await connection.query("SET FOREIGN_KEY_CHECKS=0");
  for (const table of [...backup.tables].reverse()) {
    await connection.query(`DROP TABLE IF EXISTS \`${table.name}\``);
  }
  for (const table of backup.tables) {
    await connection.query(table.createSql);
  }
  for (const table of backup.tables) {
    if (!table.rows.length) continue;
    const columns = Object.keys(table.rows[0]);
    const placeholders = columns.map(() => "").join(",");
    for (const row of table.rows) {
      await connection.query(
        `INSERT INTO \`${table.name}\` (${columns.map((column) => `\`${column}\``).join(",")})
         VALUES (${placeholders})`,
        columns.map((column) => row[column]),
      );
    }
  }
  console.log(`Sauvegarde restaurée : ${filename}`);
} finally {
  await connection.query("SET FOREIGN_KEY_CHECKS=1");
  connection.release();
  await pool.end();
}
