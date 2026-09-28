import pg from "pg";
import { env } from "../config/env.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("postgres");

export const pool = new pg.Pool({
  connectionString: env.databaseUrl(),
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  log.error({ err }, "Unexpected Postgres pool error");
});

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    log.debug({ text, ms: Date.now() - start, rows: result.rowCount }, "query executed");
    return result.rows;
  } catch (err) {
    log.error({ err, text }, "query failed");
    throw err;
  }
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
