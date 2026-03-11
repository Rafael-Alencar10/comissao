import dotenv from 'dotenv';
dotenv.config();

import * as db from '../server/db';

async function run() {
  try {
    const atendentes = await db.getAtendentes();
    const matches = atendentes.filter(a => (a.nome || '').toLowerCase().includes('alexandre'));
    console.log('Found atendentes matching "alexandre":', matches.map(m => ({ id: m.id, nome: m.nome })));

    if (matches.length === 0) {
      console.error('No atendente named Alexandre found.');
      return;
    }

    // If multiple, try first
    const atendente = matches[0];
    const mes = 2;
    const ano = 2026;

    console.log(`Checking producao for atendenteId=${atendente.id}, mes=${mes}, ano=${ano}`);
    const producao = await db.getProducaoMensalByAtendente(atendente.id, mes, ano);
    console.log('Producao result:', producao ? { id: producao.id, semanas: producao.semanas, chatSemNota: producao.chatSemNota } : null);

    if (!producao) {
      console.error('No producaoMensal found for this atendente/month/year');
      return;
    }

    const atendimentos = await db.getAtendimentosDetalhados(producao.id);
    console.log(`Found ${atendimentos.length} atendimentosDetalhados for producao id ${producao.id}`);
    atendimentos.forEach((a: any, i: number) => {
      console.log(i + 1, { id: a.id, nomeCliente: a.nomeCliente, dataAtendimento: a.dataAtendimento, nota: a.nota, tipo: a.tipo });
    });

  } catch (err: any) {
    console.error('Error in script:', err?.message || err);
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
