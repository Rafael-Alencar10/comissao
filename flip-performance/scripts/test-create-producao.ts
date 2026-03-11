import dotenv from 'dotenv';
dotenv.config();

import * as db from '../server/db';

async function run() {
  try {
    const atendentes = await db.getAtendentes();
    console.log('atendentes count', atendentes.length);
    const alex = atendentes.find(a => a.nome?.toLowerCase().includes('alexandre'));
    console.log('alex', alex);
    if (!alex) return;
    const payload = {
      atendenteId: alex.id,
      mes: 2,
      ano: 2026,
      chatTotal: 54,
      chatNota5: 43,
      chatNota4: 11,
      chatNota3: 0,
      chatNota2: 0,
      chatNota1: 0,
      chatSemNota: 0,
      ligacaoTotal: 0,
      ligacaoExtrementeSatisfeito: 0,
      ligacaoExcelente: 0,
      ligacaoBom: 0,
      ligacaoRegular: 0,
      ligacaoRuim: 0,
      ligacaoPessimo: 0,
      semanas: [
        {
          dataInicio: '2026-02-01',
          dataFim: '2026-02-08',
          totalAtendimentos: 4,
          atendimentos: [
            { obs: 'teste', nota: '1', tipo: 'chat', cliente: 'x' }
          ]
        }
      ],
    } as any;
    const res = await db.createProducaoMensal(payload);
    console.log('insert result', res);
    const prod = await db.getProducaoMensalByAtendente(alex.id, 2, 2026);
    console.log('prod fetched', prod);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();