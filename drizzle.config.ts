import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Match Next.js convention: .env.local overrides .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
