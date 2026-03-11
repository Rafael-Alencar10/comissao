/**
 * Script para atualizar a tabela producaoMensal com as novas colunas
 * Se as colunas não existirem, elas serão adicionadas
 * Se já existirem, o script ignora sem erro
 */

import mysql from "mysql2/promise";
import { ENV } from "./server/_core/env";

async function updateDatabase() {
  let connection;
  try {
    console.log("🔄 Conectando ao banco de dados...\n");

    // Parse DATABASE_URL: mysql://user:pass@host:port/database
    const dbUrl = new URL(process.env.DATABASE_URL || "");

    connection = await mysql.createConnection({
      host: dbUrl.hostname,
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1), // Remove leading /
      port: parseInt(dbUrl.port) || 3306,
    });

    console.log("✅ Conectado ao banco de dados\n");

    // SQL para adicionar as colunas (IF NOT EXISTS)
    const sqls = [
      `ALTER TABLE producaoMensal 
       ADD COLUMN IF NOT EXISTS maxPontosChat DECIMAL(10, 2) NOT NULL DEFAULT '0' 
       AFTER pontosTotais;`,

      `ALTER TABLE producaoMensal 
       ADD COLUMN IF NOT EXISTS maxPontosLigacao DECIMAL(10, 2) NOT NULL DEFAULT '0' 
       AFTER maxPontosChat;`,

      `ALTER TABLE producaoMensal 
       ADD COLUMN IF NOT EXISTS maxPontosTotais DECIMAL(10, 2) NOT NULL DEFAULT '0' 
       AFTER maxPontosLigacao;`,
    ];

    console.log("🔧 Aplicando alterações à tabela...\n");

    for (const sql of sqls) {
      try {
        await connection.execute(sql);
        console.log(`✅ ${sql.split("\n")[0].trim()}...`);
      } catch (err: any) {
        if (err.code === "ER_DUP_FIELDNAME" || err.message.includes("Duplicate column")) {
          console.log(`ℹ️  Coluna já existe (skipped)`);
        } else {
          throw err;
        }
      }
    }

    console.log("\n✅ Tabela atualizada com sucesso!");
    console.log("   - Colunas maxPontosChat, maxPontosLigacao, maxPontosTotais criadas");
    console.log("   - Pronto para recalcular bonificações");

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao atualizar banco:", err);
    if (connection) await connection.end();
    process.exit(1);
  }
}

updateDatabase();
