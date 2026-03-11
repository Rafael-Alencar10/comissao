// @ts-ignore
import { default as fetch } from 'node-fetch';

async function testSave() {
  try {
    console.log('\n🧪 TESTE DE SALVAMENTO DE DADOS\n');

    // Simular um POST para criar produção com atendimentos
    const prodData = {
      atendenteId: 1,
      mes: 2,
      ano: 2026,
      chatTotal: 3,
      chatNota5: 1,
      chatNota4: 1,
      chatNota3: 1,
      chatNota2: 0,
      chatNota1: 0,
      ligacaoTotal: 0,
      ligacaoExtrementeSatisfeito: 0,
      ligacaoExcelente: 0,
      ligacaoBom: 0,
      ligacaoRegular: 0,
      ligacaoRuim: 0,
      ligacaoPessimo: 0,
      semanas: [
        [
          { cliente: "João Silva", obs: "Atendimento rápido e eficiente", nota: "5", massiva: false, retirarNota: false, tipo: "chat" },
          { cliente: "Maria Santos", obs: "Cliente satisfeito", nota: "4", massiva: false, retirarNota: false, tipo: "chat" },
          { cliente: "Pedro Costa", obs: "Problema resolvido", nota: "3", massiva: false, retirarNota: false, tipo: "chat" }
        ]
      ]
    };

    console.log('📤 Enviando dados:', JSON.stringify(prodData, null, 2).substring(0, 200) + '...');

    // Usar fetch nativo do Node.js 18+
    const response = await globalThis.fetch('http://localhost:3000/trpc/producao.create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodData)
    });

    const result = await response.json();
    console.log('\n✅ Resposta HTTP:', response.status);
    console.log(JSON.stringify(result, null, 2).substring(0, 300) + '...');

    // Aguardar 2 segundos para os registros serem salvos
    await new Promise(r => setTimeout(r, 2000));

    // Verificar no banco
    const mysql = await import('mysql2/promise');
    const connection = await mysql.default.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'A3t5h3c2*',
      database: 'flip'
    });

    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM atendimentosdetalhados'
    );
    const count = (rows as any)[0]?.count || 0;
    console.log(`\n✅ Total de registros em atendimentosdetalhados: ${count}`);

    await connection.end();

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  }

  process.exit(0);
}

testSave();
