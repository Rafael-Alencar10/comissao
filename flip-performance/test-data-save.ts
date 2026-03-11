import { getDb } from './server/db';

async function testDataSave() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    process.exit(1);
  }

  try {
    console.log('\n📊 TESTE DE SALVAMENTO DE DADOS\n');

    // 1. Verificar se existem registros na tabela
    const result = await db.execute('SELECT COUNT(*) as count FROM atendimentosdetalhados');
    console.log('✅ Total de registros em atendimentosdetalhados:', (result as any)[0]?.count || 0);

    // 2. Listar alguns registros
    const records = await db.execute('SELECT * FROM atendimentosdetalhados LIMIT 5');
    console.log('\n📝 Últimos registros:');
    console.log(records);

    // 3. Verificar estrutura da tabela
    const columns = await db.execute('DESCRIBE atendimentosdetalhados');
    console.log('\n🏗️ Estrutura da tabela:');
    (columns as any).forEach((col: any) => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testDataSave();
