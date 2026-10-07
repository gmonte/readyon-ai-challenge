import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  test: {
    projects: [
      {
        // Server: services and resolvers against an in-memory PGlite Postgres.
        resolve: { tsconfigPaths: true },
        test: {
          name: "server",
          environment: "node",
          globals: true,
          include: ["src/server/**/*.test.ts"],
          hookTimeout: 30_000,
          env: { TZ: "UTC" },
        },
      },
      {
        // Client: React components in jsdom.
        plugins: [react()],
        resolve: { tsconfigPaths: true },
        test: {
          name: "client",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./vitest.setup.ts"],
          include: ["__tests__/**/*.test.{ts,tsx}", "src/client/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
