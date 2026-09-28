import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "./postgres.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("migrate");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const sql = readFileSync(path.join(__dirname, "migrations", "001_init.sql"), "utf-8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    log.info("Migration applied successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    log.error({ err }, "Migration failed");
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
