import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  // Ajuste o caminho abaixo para onde você moveu seu schema.ts
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // MUDADO: de mysql para postgresql
  dbCredentials: {
    url: connectionString,
  },
});