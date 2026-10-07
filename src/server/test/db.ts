import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "node:path";
import * as schema from "../db/schema";

/** In-memory Postgres for tests: boots PGlite and applies the real migrations in `drizzle/`. */
export async function createTestDb() {
  const client = await PGlite.create();
  const db = drizzle({ client, schema, casing: "snake_case" });
  await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });

  return {
    db,
    async reset() {
      await db.execute(
        sql`TRUNCATE TABLE attendance_records, attendance_requests, location_memberships, users, locations CASCADE`,
      );
    },
    async close() {
      await client.close();
    },
  };
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;
