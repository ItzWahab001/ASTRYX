import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Builds a drop-in replacement for src/db/postgres.ts's exports (`pool`, `query`,
 * `withTransaction`), backed by a fresh in-memory Postgres instance (pg-mem) with the real
 * production schema (src/db/migrations/001_init.sql) applied. Repository modules import
 * `query`/`withTransaction` from "../db/postgres.js" — vi.mock swaps that import for this,
 * so the repository layer's actual SQL runs against a real (if in-memory) SQL engine, not a
 * hand-stubbed query() that just returns whatever the test wants.
 *
 * Call once per test file (each call gets an isolated database) inside a self-contained
 * `vi.mock("../../src/db/postgres.js", () => createPgMemPostgresModule())` — everything this
 * needs is resolved inside this function so it's safe regardless of vitest's mock hoisting.
 */
export async function createPgMemPostgresModule() {
  const { newDb } = await import("pg-mem");
  const db = newDb({ autoCreateForeignKeyIndices: true });

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.join(__dirname, "..", "..", "src", "db", "migrations", "001_init.sql");
  const schemaSql = readFileSync(schemaPath, "utf-8");
  db.public.none(schemaSql);

  const { Pool } = db.adapters.createPg();
  const pool = new Pool();

  async function query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const result = await pool.query(text, params);
    return result.rows as T[];
  }

  async function withTransaction<T>(fn: (client: unknown) => Promise<T>): Promise<T> {
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

  return { pool, query, withTransaction };
}
