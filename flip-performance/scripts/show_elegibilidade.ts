import { getProducaoMensalByMesAno, getAtendentes } from "../server/db";
import { calcularMediaTurno } from "../server/bonificacao";

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: npx tsx scripts/show_elegibilidade.ts <mes> <ano> <nome1> [<nome2> ...]");
    process.exit(1);
  }

  const mes = parseInt(args[0], 10);
  const ano = parseInt(args[1], 10);
  const nomes = args.slice(2).map(s => s.toLowerCase());

  try {
    const producoes = await getProducaoMensalByMesAno(mes, ano);
    const atendentes = await getAtendentes();

    const results = producoes
      .filter(p => {
        const atend = atendentes.find(a => a.id === p.atendenteId);
        return atend && nomes.includes(atend.nome.toLowerCase());
      })
      .map(p => {
        const atend = atendentes.find(a => a.id === p.atendenteId);
        const producoesTurno = producoes.filter(prod => {
          const a = atendentes.find(at => at.id === prod.atendenteId);
          return a?.turno === atend?.turno;
        });

        const mediaDoTurno = calcularMediaTurno(
          producoesTurno.map(pr => ({
            chatTotal: pr.chatTotal,
            chatNota5: pr.chatNota5,
            chatNota4: pr.chatNota4,
            chatNota3: pr.chatNota3,
            chatNota2: pr.chatNota2,
            chatNota1: pr.chatNota1,
            ligacaoTotal: pr.ligacaoTotal,
            ligacaoExtrementeSatisfeito: pr.ligacaoExtrementeSatisfeito,
            ligacaoExcelente: pr.ligacaoExcelente,
            ligacaoBom: pr.ligacaoBom,
            ligacaoRegular: pr.ligacaoRegular,
            ligacaoRuim: pr.ligacaoRuim,
            ligacaoPessimo: pr.ligacaoPessimo,
          }))
        );

        const atendimentosTotais = p.chatTotal + p.ligacaoTotal;
        const motivo = (() => {
          if (parseFloat(p.performance as any) < 80) return `Performance abaixo de 80% (atual: ${parseFloat(p.performance as any).toFixed(2)}%)`;
          if (atendimentosTotais < mediaDoTurno) return `Atendimentos insuficientes (atual: ${atendimentosTotais}, necessário: ${Math.ceil(mediaDoTurno)})`;
          return null;
        })();

        return {
          nome: atend?.nome,
          turno: atend?.turno,
          chatTotal: p.chatTotal,
          ligacaoTotal: p.ligacaoTotal,
          atendimentosTotais,
          performance: parseFloat(p.performance as any).toFixed(2),
          mediaDoTurno: mediaDoTurno.toFixed(2),
          elegivel: p.elegivel === 1,
          motivoNaoElegivel: motivo,
          bonificacao: parseFloat(p.bonificacao as any),
        };
      });

    if (results.length === 0) {
      console.log("Nenhum registro encontrado para os nomes fornecidos neste mês/ano.");
      process.exit(0);
    }

    console.table(results);
  } catch (err) {
    console.error("Erro ao consultar dados:", err);
    process.exit(1);
  }
}

main();
