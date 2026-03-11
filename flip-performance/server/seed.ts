import bcrypt from "bcryptjs";
// use PostgreSQL variant when connected to Supabase
import * as db from "./db-pg";
import dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function seed() {
  try {
    console.log("🌱 Iniciando seed do banco de dados...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✓ Configurado" : "✗ Não encontrado");

    // Initialize database
    const database = await db.getDb();
    if (!database) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }

    // Check if admin user already exists
    const existingAdmin = await db.getUserCredentialByUsername("admin");

    if (existingAdmin) {
      console.log("✅ Usuário admin já existe");
      process.exit(0);
    }

    // Create admin user with default password
    const defaultPassword = "admin123"; // Change this to a secure password in production
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await db.createUserCredential({
      username: "admin",
      passwordHash,
      role: "admin",
      status: "ativo",
      permissions: JSON.stringify(["*"]),
    });

    console.log("✅ Usuário admin criado com sucesso!");
    console.log("   Usuário: admin");
    console.log("   Senha: " + defaultPassword);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao fazer seed:", error);
    process.exit(1);
  }
}

seed();
