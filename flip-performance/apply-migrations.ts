/**
 * Script para aplicar as migrações do Drizzle
 * Isso criará as colunas maxPontosChat, maxPontosLigacao, maxPontosTotais
 * 
 * Uso: npx tsx apply-migrations.ts
 */

import { migrate } from "drizzle-orm/mysql2/migrator";
import { getDb } from "./server/db";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigrations() {
  try {
    console.log("🔄 Aplicando migrações do Drizzle...\n");

    const db = await getDb();

    if (!db) {
      console.error("❌ Erro: Banco de dados não disponível");
      console.log("   Certifique-se de que DATABASE_URL está configurada");
      process.exit(1);
    }

    const migrationsFolder = path.resolve(__dirname, "./drizzle/migrations");
    console.log(`📁 Pasta de migrações: ${migrationsFolder}\n`);

    await migrate(db as any, {
      migrationsFolder,
    });

    console.log("\n✅ Migrações aplicadas com sucesso!");
    console.log("   - As colunas maxPontosChat, maxPontosLigacao e maxPontosTotais foram criadas");
    console.log("   - O banco está pronto para receber os dados atualizados");

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao aplicar migrações:", err);
    process.exit(1);
  }
}

applyMigrations();
