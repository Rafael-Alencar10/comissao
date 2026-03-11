import * as db from "./db-pg";
import { calcularMediaTurno } from "./bonificacao";

/**
 * Verifica e cria notificações de desempenho baixo para todos os atendentes
 * Compara o desempenho individual com a média do turno
 */
export async function verificarDesempenhoBaixo(mes: number, ano: number) {
  const atendentes = await db.getAtendentes();
  const producoes = await db.getProducaoMensalByMesAno(mes, ano);

  for (const atendente of atendentes) {
    if (atendente.status !== "Ativo") continue;

    const producao = producoes.find((p) => p.atendenteId === atendente.id);
    if (!producao) continue;

    // Calcular média do turno
    const producoesTurno = producoes.filter((p) => {
      const a = atendentes.find((at) => at.id === p.atendenteId);
      return a?.turno === atendente.turno;
    });

    const atendentesTurnoAtivos = atendentes.filter(
      (a) => a.turno === atendente.turno && a.status === "Ativo"
    );

    const totalAtendimentos = producoesTurno.reduce((sum, p) => sum + p.atendimentosTotais, 0);
    const mediaAtendimentos = atendentesTurnoAtivos.length > 0 ? totalAtendimentos / atendentesTurnoAtivos.length : 0;
    const mediaPerformance =
      producoesTurno.length > 0
        ? producoesTurno.reduce((sum, p) => sum + parseFloat(p.performance), 0) / producoesTurno.length
        : 0;

    const performance = parseFloat(producao.performance);
    const atendimentos = producao.atendimentosTotais;

    // Verificar se está abaixo da média
    const abaixoMediaAtendimentos = atendimentos < mediaAtendimentos;
    const abaixoMediaPerformance = performance < mediaPerformance;

    if (abaixoMediaAtendimentos || abaixoMediaPerformance) {
      // Verificar se já existe notificação para este mês
      const notificacoesExistentes = await db.getNotificacoesByAtendente(atendente.id);
      const jaNotificado = notificacoesExistentes.some(
        (n) => n.tipo === "desempenho_baixo" && n.mes === mes && n.ano === ano
      );

      if (!jaNotificado) {
        let mensagem = `Seu desempenho em ${mes}/${ano} está abaixo da média do turno ${atendente.turno}. `;

        if (abaixoMediaAtendimentos) {
          mensagem += `Atendimentos: ${atendimentos} (média: ${mediaAtendimentos.toFixed(1)}). `;
        }

        if (abaixoMediaPerformance) {
          mensagem += `Performance: ${performance.toFixed(2)}% (média: ${mediaPerformance.toFixed(2)}%).`;
        }

        await db.createNotificacao({
          atendenteId: atendente.id,
          tipo: "desempenho_baixo",
          titulo: "Desempenho Abaixo da Média",
          mensagem,
          mes,
          ano,
          lida: 0,
        });
      }
    }
  }
}

/**
 * Verifica e cria notificações de elegibilidade
 * Alerta quando um atendente deixa de ser elegível para bonificação
 */
export async function verificarElegibilidade(mes: number, ano: number) {
  const producoes = await db.getProducaoMensalByMesAno(mes, ano);

  for (const producao of producoes) {
    const elegivel = producao.elegivel === 1;

    if (!elegivel && producao.motivoNaoElegivel) {
      // Verificar se já existe notificação
      const notificacoesExistentes = await db.getNotificacoesByAtendente(producao.atendenteId);
      const jaNotificado = notificacoesExistentes.some(
        (n) => n.tipo === "elegibilidade_alterada" && n.mes === mes && n.ano === ano
      );

      if (!jaNotificado) {
        await db.createNotificacao({
          atendenteId: producao.atendenteId,
          tipo: "elegibilidade_alterada",
          titulo: "Não Elegível para Bonificação",
          mensagem: `Você não está elegível para bonificação em ${mes}/${ano}. Motivo: ${producao.motivoNaoElegivel}`,
          mes,
          ano,
          lida: 0,
        });
      }
    }
  }
}

/**
 * Verifica e cria notificações de meta atingida
 * Alerta quando um atendente atinge 100% de performance
 */
export async function verificarMetaAtingida(mes: number, ano: number) {
  const producoes = await db.getProducaoMensalByMesAno(mes, ano);

  for (const producao of producoes) {
    const performance = parseFloat(producao.performance);

    if (performance >= 100) {
      // Verificar se já existe notificação
      const notificacoesExistentes = await db.getNotificacoesByAtendente(producao.atendenteId);
      const jaNotificado = notificacoesExistentes.some(
        (n) => n.tipo === "meta_atingida" && n.mes === mes && n.ano === ano
      );

      if (!jaNotificado) {
        await db.createNotificacao({
          atendenteId: producao.atendenteId,
          tipo: "meta_atingida",
          titulo: "Meta Atingida!",
          mensagem: `Parabéns! Você atingiu 100% de performance em ${mes}/${ano}. Bonificação: R$ ${parseFloat(producao.bonificacao).toFixed(2)}`,
          mes,
          ano,
          lida: 0,
        });
      }
    }
  }
}

/**
 * Executa todas as verificações de notificação
 */
export async function executarVerificacoesNotificacoes(mes: number, ano: number) {
  try {
    await verificarDesempenhoBaixo(mes, ano);
    await verificarElegibilidade(mes, ano);
    await verificarMetaAtingida(mes, ano);
  } catch (error) {
    console.error("[Notificações] Erro ao executar verificações:", error);
  }
}
