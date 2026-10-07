import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Pooled endpoints (Neon's "-pooler" host, PgBouncer) can't hold prepared statements across connections.
  const pooled = /-pooler\.|pgbouncer=true/.test(url);
  const client = postgres(url, { max: 10, prepare: !pooled });
  return drizzle({ client, schema, casing: "snake_case" });
}

// Reuse the pool across Next.js hot reloads in development.
const globalForDb = globalThis as unknown as { __readyonDb?: ReturnType<typeof createDb> };

export function getDb() {
  if (!globalForDb.__readyonDb) globalForDb.__readyonDb = createDb();
  return globalForDb.__readyonDb;
}
