import bcrypt from "bcryptjs";
import * as db from "./server/db";
import dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function resetPassword() {
  try {
    console.log("🔄 Resetando senha do admin...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✓ Configurado" : "✗ Não encontrado");

    // Initialize database
    const database = await db.getDb();
    if (!database) {
      throw new Error("Não foi possível conectar ao banco de dados");
    }

    // Find admin user
    const admin = await db.getUserCredentialByUsername("admin");

    if (!admin) {
      console.log("❌ Usuário admin não encontrado no banco de dados");
      process.exit(1);
    }

    // Create new password hash
    const newPassword = "admin123";
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.updateUserCredential(admin.id, {
      passwordHash,
    });

    console.log("✅ Senha do admin resetada com sucesso!");
    console.log("   Usuário: admin");
    console.log("   Senha: " + newPassword);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao resetar senha:", error);
    process.exit(1);
  }
}

resetPassword();
