import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile();
} catch {
  // .env is optional (CI, tests)
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  // Migrations prefer a direct connection: Neon and other PgBouncer-style poolers are meant for app traffic.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "" },
});
