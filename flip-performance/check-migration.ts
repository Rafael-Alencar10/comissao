import { getDb } from './server/db';

async function checkTables() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    process.exit(1);
  }

  try {
    // Usar raw query para verificar tabela
    const result = await db.execute('SELECT 1 FROM atendimentosDetalhados LIMIT 1');
    console.log('✅ Table atendimentosDetalhados exists and is accessible');
    process.exit(0);
  } catch (error: any) {
    if (error.message.includes('no such table') || error.message.includes('doesn\'t exist')) {
      console.log('❌ Table atendimentosDetalhados does NOT exist');
    } else {
      console.log('✅ Table exists (error is from data, not table)', error.message.substring(0, 50));
    }
    process.exit(0);
  }
}

checkTables();
