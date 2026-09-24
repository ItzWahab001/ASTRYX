import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
export * from './schema.js';
const url=process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/dynex';
export const sql=postgres(url,{max:Number(process.env.DB_POOL_SIZE??10),prepare:false});
export const db=drizzle(sql,{schema});
export type DB=typeof db;
