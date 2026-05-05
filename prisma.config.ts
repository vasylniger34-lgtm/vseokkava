import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: path.join(import.meta.dirname, "prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
    // Робимо DIRECT_URL необов'язковим для етапу білду (prisma generate)
    directUrl: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
