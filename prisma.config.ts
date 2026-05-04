import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Keep `prisma generate` working in environments where the DB URL
    // is intentionally absent, while still preferring the direct URL
    // for CLI operations when it is available.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
