import dotenv from "dotenv"
import path from "path"
import { defineConfig } from "prisma/config"

// Load .env.local first (Next.js convention, has real secrets), then .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
})
