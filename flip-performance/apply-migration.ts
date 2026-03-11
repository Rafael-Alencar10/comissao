import mysql from 'mysql2/promise';

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'A3t5h3c2*',
      database: 'flip'
    });

    console.log("\n🔧 Aplicando migration: Adicionando coluna chatSemNota...\n");

    const query = `ALTER TABLE \`producaoMensal\` ADD COLUMN \`chatSemNota\` int DEFAULT 0 NOT NULL`;

    try {
      await connection.execute(query);
      console.log("✅ Coluna chatSemNota adicionada com sucesso!");
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log("⚠️ Coluna chatSemNota já existe na tabela");
      } else {
        throw error;
      }
    }

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

main();
