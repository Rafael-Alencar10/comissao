import mysql from 'mysql2/promise';

async function fullCheck() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'A3t5h3c2*',
      database: 'flip'
    });

    console.log('\n📊 VERIFICAÇÃO COMPLETA DO BANCO\n');

    // 1. Contar total
    const [rows1] = await connection.execute(
      'SELECT COUNT(*) as count FROM atendimentosdetalhados'
    );
    const count = (rows1 as any)[0]?.count || 0;
    console.log(`✅ Total de registros em atendimentosdetalhados: ${count}\n`);

    // 2. Listar TODOS
    if (count > 0) {
      const [rows2] = await connection.execute(
        'SELECT id, producaoMensalId, atendenteId, nomeCliente, tipo, nota, auditoria, massiva, retirarNota, createdAt FROM atendimentosdetalhados ORDER BY id'
      );
      console.log('📝 Todos os registros:');
      (rows2 as any).forEach((row: any) => {
        console.log(`  ID ${row.id}:`);
        console.log(`    - Cliente: ${row.nomeCliente || '(sem nome)'}`);
        console.log(`    - Tipo: ${row.tipo}`);
        console.log(`    - Nota: ${row.nota}`);
        console.log(`    - Auditoria: ${row.auditoria || '(vazia)'}`);
        console.log(`    - Massiva: ${row.massiva}`);
        console.log(`    - Retirar Nota: ${row.retirarNota}`);
        console.log(`    - Data: ${row.createdAt}\n`);
      });
    }

    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

fullCheck();
