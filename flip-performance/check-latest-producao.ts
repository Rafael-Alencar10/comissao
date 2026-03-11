import mysql from 'mysql2/promise';

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'A3t5h3c2*',
      database: 'flip'
    });

    console.log("\n📊 VERIFICANDO ÚLTIMOS REGISTROS DE PRODUCAOMENSAL\n");

    const query = `
      SELECT id, atendenteId, mes, ano, chatTotal, chatNota1, chatNota2, chatNota3, chatNota4, chatNota5,
             chatSemNota, ligacaoTotal, createdAt, updatedAt, semanas
      FROM producaomensal
      ORDER BY createdAt DESC
      LIMIT 5
    `;

    const [rows] = await connection.execute(query) as any;

    console.log(`Total de registros retornados: ${rows.length}\n`);

    rows.forEach((row: any, idx: number) => {
      console.log(`\n--- Registro ${idx + 1} (ID: ${row.id}) ---`);
      console.log(`Atendente ID: ${row.atendenteId}`);
      console.log(`Mês/Ano: ${row.mes}/${row.ano}`);
      console.log(`Chat Total: ${row.chatTotal}`);
      console.log(`Chat Sem Nota: ${row.chatSemNota}`);
      console.log(`Chat Nota 1: ${row.chatNota1}`);
      console.log(`Chat Nota 2: ${row.chatNota2}`);
      console.log(`Chat Nota 3: ${row.chatNota3}`);
      console.log(`Chat Nota 4: ${row.chatNota4}`);
      console.log(`Chat Nota 5: ${row.chatNota5}`);
      console.log(`Ligação Total: ${row.ligacaoTotal}`);
      console.log(`Criado em: ${row.createdAt}`);
      console.log(`Atualizado em: ${row.updatedAt}`);

      if (row.semanas) {
        try {
          const semanasData = typeof row.semanas === 'string' ? JSON.parse(row.semanas) : row.semanas;
          console.log(`✅ Semanas salvo (${Array.isArray(semanasData) ? semanasData.length + ' semanas' : 'objeto'})`);
          if (Array.isArray(semanasData) && semanasData.length > 0) {
            console.log(`   Primeira semana tem ${semanasData[0]?.length || 0} atendimentos`);
          }
        } catch (e) {
          console.log(`⚠️ Semanas (erro ao parsear): ${(e as any).message}`);
        }
      } else {
        console.log(`❌ Semanas: (vazio/null)`);
      }
    });

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

main();