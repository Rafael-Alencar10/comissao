import mysql from 'mysql2/promise';

async function checkAndCleanDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'A3t5h3c2*',
      database: 'flip'
    });

    console.log('\n📊 ESTADO DO BANCO DE DADOS\n');

    // 1. Contar registros em atendimentosdetalhados
    const [rows1] = await connection.execute(
      'SELECT COUNT(*) as count FROM atendimentosdetalhados'
    );
    const count = (rows1 as any)[0]?.count || 0;
    console.log(`Total de registros em atendimentosdetalhados: ${count}`);

    // 2. Listar registros se houver
    if (count > 0) {
      const [rows2] = await connection.execute(
        'SELECT id, producaoMensalId, atendenteId, nomeCliente, tipo, nota, auditoria, createdAt FROM atendimentosdetalhados LIMIT 10'
      );
      console.log('\n📝 Últimos registros:');
      (rows2 as any).forEach((row: any, i: number) => {
        console.log(`  ${i + 1}. ID ${row.id}: ${row.nomeCliente} (${row.tipo}) Nota:${row.nota} - ${row.createdAt}`);
      });
    }

    // 3. Contar produções
    const [rows3] = await connection.execute(
      'SELECT COUNT(*) as count FROM producaomensal'
    );
    const prodCount = (rows3 as any)[0]?.count || 0;
    console.log(`\nTotal de registros em producaomensal: ${prodCount}`);

    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkAndCleanDatabase();
