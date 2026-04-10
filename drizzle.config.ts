import dotenv from "dotenv";
dotenv.config();
import { defineConfig } from "drizzle-kit";


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export default defineConfig({
  /* ================= MIGRATIONS ================= */
  out: "./drizzle",
  schema: "./src/db/schema",

  /* ================= DATABASE ================= */
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },

  /* ================= BEHAVIOR ================= */
  verbose: true,
  strict: true,

  /* ================= OPTIONAL ================= */
  migrations: {
    table: "__drizzle_migrations__",
    schema: "public",
  },
});
