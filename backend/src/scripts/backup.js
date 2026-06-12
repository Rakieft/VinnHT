import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import pool from "../config/database.js";

const backupDirectory = path.resolve(process.env.BACKUP_DIRECTORY || "./backups");
const retentionDays = Math.max(1, Number(process.env.BACKUP_RETENTION_DAYS || 14));
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const filename = path.join(backupDirectory, `vinnht-${timestamp}.json`);

await fs.mkdir(backupDirectory, { recursive: true });

try {
  const [tableRows] = await pool.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE'
     ORDER BY TABLE_NAME`,
    [process.env.DB_NAME || "vinnht"],
  );

  const backup = {
    database: process.env.DB_NAME || "vinnht",
    createdAt: new Date().toISOString(),
    tables: [],
  };

  for (const { TABLE_NAME: table } of tableRows) {
    const [[createRow]] = await pool.query(`SHOW CREATE TABLE \`${table}\``);
    const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
    backup.tables.push({
      name: table,
      createSql: createRow["Create Table"],
      rows,
    });
  }

  await fs.writeFile(filename, JSON.stringify(backup, null, 2), "utf8");
  const oldestAllowed = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  for (const entry of await fs.readdir(backupDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.startsWith("vinnht-") || !entry.name.endsWith(".json")) continue;
    const fullPath = path.join(backupDirectory, entry.name);
    const stats = await fs.stat(fullPath);
    if (stats.mtimeMs < oldestAllowed) await fs.unlink(fullPath);
  }
  console.log(`Sauvegarde créée : ${filename}`);
} finally {
  await pool.end();
}
