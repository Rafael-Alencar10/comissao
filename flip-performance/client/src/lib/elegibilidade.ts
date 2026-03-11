/**
 * Shared eligibility calculation logic (CLIENT SIDE)
 * Espelho exato da lógica do servidor (server/bonificacao.ts)
 * Usado nas páginas para exibição em tempo real — NÃO recalcula no servidor.
 *
 * Regras de elegibilidade:
 *   1. Performance >= 80%
 *   2. Total de atendimentos >= média de atendimentos do turno (igual já vale)
 */

export interface ProducaoData {
  chatTotal: number;
  chatNota5: number;
  chatNota4: number;
  chatNota3: number;
  chatNota2: number;
  chatNota1: number;
  ligacaoTotal: number;
  ligacaoExtrementeSatisfeito: number;
  ligacaoExcelente: number;
  ligacaoBom: number;
  ligacaoRegular: number;
  ligacaoRuim: number;
  ligacaoPessimo: number;
}

export interface EligibilidadeResult {
  performance: number;
  atendimentosTotais: number;
  elegivel: boolean;
  motivo: string | null;
}

/**
 * Calcula a performance % com base nas contagens de notas.
 * Não aplica tolerância — para exibição simples. O servidor aplica a tolerância
 * personalizada ao salvar; aqui usamos o valor já salvo em `p.performance`.
 */
export function calcularPerformance(data: ProducaoData): number {
  const totalChatRatings =
    data.chatNota5 + data.chatNota4 + data.chatNota3 + data.chatNota2 + data.chatNota1;

  const totalLigacaoRatings =
    data.ligacaoExtrementeSatisfeito +
    data.ligacaoExcelente +
    data.ligacaoBom +
    data.ligacaoRegular +
    data.ligacaoRuim +
    data.ligacaoPessimo;

  const pontosChat =
    data.chatNota5 * 5 +
    data.chatNota4 * 2 +
    data.chatNota3 * -3 +
    data.chatNota2 * -10 +
    data.chatNota1 * -10;

  const pontosLigacao =
    data.ligacaoExtrementeSatisfeito * 5 +
    data.ligacaoExcelente * 2 +
    data.ligacaoBom * 1 +
    data.ligacaoRegular * 0 +
    data.ligacaoRuim * -10 +
    data.ligacaoPessimo * -10;

  const pontosTotais = pontosChat + pontosLigacao;
  const maxPontos = (totalChatRatings + totalLigacaoRatings) * 5;

  const performance = maxPontos > 0 ? (pontosTotais / maxPontos) * 100 : 0;
  return Math.round(performance * 100) / 100;
}

/**
 * CORRIGIDO: Calcula a média de ATENDIMENTOS (chat + ligação) do turno.
 *
 * @param producoes - Lista de produções do mesmo turno
 * @returns Média de atendimentos totais por atendente
 */
export function calcularMediaAtendimentosTurno(
  producoes: Array<{ chatTotal: number; ligacaoTotal: number }>
): number {
  if (producoes.length === 0) return 0;

  const total = producoes.reduce((sum, p) => sum + p.chatTotal + p.ligacaoTotal, 0);
  return Math.round((total / producoes.length) * 100) / 100;
}

/**
 * CORRIGIDO: Verifica elegibilidade com os dois critérios corretos:
 *   1. performance >= 80%
 *   2. totalAtendimentos >= mediaAtendimentosTurno ajustada pela tolerância
 *      (mínimo = mediaAtendimentosTurno * (1 - tolerancia/100))
 *
 * @param performance              - Performance % do atendente
 * @param totalAtendimentos        - Total de atendimentos do atendente
 * @param mediaAtendimentosTurno   - Média de atendimentos do turno
 * @param toleranciaAtendente      - % de tolerância personalizada (0 = sem tolerância)
 */
export function verificarElegibilidade(
  performance: number,
  totalAtendimentos: number,
  mediaAtendimentosTurno: number,
  toleranciaAtendente: number = 0
): { elegivel: boolean; motivo: string | null } {
  if (performance < 80) {
    return {
      elegivel: false,
      motivo: `Performance abaixo de 80% (atual: ${performance.toFixed(1)}%)`,
    };
  }

  // Aplica tolerância na média de atendimentos do turno
  const mediaAjustada = mediaAtendimentosTurno * (1 - toleranciaAtendente / 100);

  if (totalAtendimentos < mediaAjustada) {
    return {
      elegivel: false,
      motivo: `Atendimentos insuficientes (atual: ${totalAtendimentos}, mínimo: ${Math.ceil(mediaAjustada)} com ${toleranciaAtendente}% tolerância)`,
    };
  }

  return {
    elegivel: true,
    motivo: null,
  };
}

/**
 * Calcula elegibilidade completa (performance + critérios de elegibilidade).
 * Usado nas páginas para exibição em tempo real.
 *
 * @param data                   - Dados de produção
 * @param mediaAtendimentosTurno - Média de atendimentos do turno (não performance)
 * @param toleranciaAtendente    - % de tolerância personalizada (0 = sem tolerância)
 */
export function calcularElegibilidade(
  data: ProducaoData,
  mediaAtendimentosTurno: number,
  toleranciaAtendente: number = 0
): EligibilidadeResult {
  const performance = calcularPerformance(data);
  const atendimentosTotais = data.chatTotal + data.ligacaoTotal;
  const { elegivel, motivo } = verificarElegibilidade(
    performance,
    atendimentosTotais,
    mediaAtendimentosTurno,
    toleranciaAtendente
  );

  return {
    performance,
    atendimentosTotais,
    elegivel,
    motivo,
  };
}

import { BONIFICACAO_TABLE } from "@shared/bonificacao-rules";

/**
 * Retorna o valor de bonificação baseado na performance %.
 * Usar apenas quando elegivel = true.
 */
export function calcularBonificacao(performance: number): number {
  for (const [minPerf, bonus] of BONIFICACAO_TABLE) {
    if (performance >= minPerf) return bonus;
  }
  return 0;
}
