/**
 * Bonification calculation utilities with Índice de Aproveitamento
 * Implements the scoring and eligibility rules for the Flip Telecom system
 *
 * Model: Índice de Aproveitamento com Margem de Erro Proporcional
 * - Pesos de Pontuação based on ratings
 * - Taxa de Tolerância: configurable per attendant (neutralizes negative points)
 * - Final Formula: (Soma de Pontos Obtidos / Soma de Pontuação Máxima Possível) * 100
 * - Bonus Criteria:
 *     1. Performance >= 80%
 *     2. Total de atendimentos >= média de atendimentos do turno
 */

import { CHAT_SCORES, LIGACAO_SCORES, BONIFICACAO_TABLE } from "../shared/bonificacao-rules";

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

export interface ErroComTaxaTolerance {
  quantidade: number;
  pontos: number;
}

export interface CalculoResult {
  pontosChat: number;
  pontosLigacao: number;
  pontosTotais: number;
  maxPontosChat: number;
  maxPontosLigacao: number;
  maxPontosTotais: number;
  atendimentosTotais: number;
  taxaToleranciaConta: number;
  errosComTolerancia: ErroComTaxaTolerance;
  performance: number;
  bonificacao: number;
  elegivel: boolean;
  motivoNaoElegivel: string | null;
}

export function separarPontosPorTipo(data: ProducaoData): {
  pontosChatArray: number[];
  pontosLigacaoArray: number[];
} {
  const pontosChatArray: number[] = [];
  const pontosLigacaoArray: number[] = [];

  for (let i = 0; i < data.chatNota5; i++) pontosChatArray.push(CHAT_SCORES[5]);
  for (let i = 0; i < data.chatNota4; i++) pontosChatArray.push(CHAT_SCORES[4]);
  for (let i = 0; i < data.chatNota3; i++) pontosChatArray.push(CHAT_SCORES[3]);
  for (let i = 0; i < data.chatNota2; i++) pontosChatArray.push(CHAT_SCORES[2]);
  for (let i = 0; i < data.chatNota1; i++) pontosChatArray.push(CHAT_SCORES[1]);

  for (let i = 0; i < data.ligacaoExtrementeSatisfeito; i++)
    pontosLigacaoArray.push(LIGACAO_SCORES.extrementeSatisfeito);
  for (let i = 0; i < data.ligacaoExcelente; i++)
    pontosLigacaoArray.push(LIGACAO_SCORES.excelente);
  for (let i = 0; i < data.ligacaoBom; i++)
    pontosLigacaoArray.push(LIGACAO_SCORES.bom);
  for (let i = 0; i < data.ligacaoRegular; i++)
    pontosLigacaoArray.push(LIGACAO_SCORES.regular);
  for (let i = 0; i < data.ligacaoRuim; i++)
    pontosLigacaoArray.push(LIGACAO_SCORES.ruim);
  for (let i = 0; i < data.ligacaoPessimo; i++)
    pontosLigacaoArray.push(LIGACAO_SCORES.pessimo);

  return { pontosChatArray, pontosLigacaoArray };
}

export function aplicarMargemErroTolerance(
  pontosChatArray: number[],
  pontosLigacaoArray: number[],
  toleranciaAtendente: number = 0
): {
  pontosAjustadosChat: number;
  pontosAjustadosLigacao: number;
  taxaToleranciaConta: number;
  errosComTolerancia: ErroComTaxaTolerance;
} {
  const totalAtendimentos = pontosChatArray.length + pontosLigacaoArray.length;
  const taxaToleranciaNumerica = toleranciaAtendente / 100;
  const taxaToleranciaConta = Math.floor(totalAtendimentos * taxaToleranciaNumerica);

  const todosOsPontos = [
    ...pontosChatArray.map(p => ({ ponto: p, tipo: 'chat' as const })),
    ...pontosLigacaoArray.map(p => ({ ponto: p, tipo: 'ligacao' as const })),
  ];

  const negativePoints = todosOsPontos.filter(p => p.ponto < 0);

  let errosNeutralizados = 0;
  let pontosPerdidosNeutrados = 0;

  for (let i = 0; i < Math.min(taxaToleranciaConta, negativePoints.length); i++) {
    pontosPerdidosNeutrados += negativePoints[i].ponto;
    errosNeutralizados++;
  }

  let chatNegativeInTolerance = 0;
  let chatNegativeCount = 0;
  for (const p of pontosChatArray) {
    if (p < 0) {
      chatNegativeCount++;
      if (chatNegativeCount <= taxaToleranciaConta) {
        chatNegativeInTolerance++;
      }
    }
  }

  let ligacaoNegativeInTolerance = 0;
  let ligacaoNegativeCount = 0;
  for (const p of pontosLigacaoArray) {
    if (p < 0) {
      ligacaoNegativeCount++;
      if (chatNegativeInTolerance + ligacaoNegativeCount <= taxaToleranciaConta) {
        ligacaoNegativeInTolerance++;
      }
    }
  }

  let pontosAjustadosChat = 0;
  let chatNegativeNeutralized = 0;
  for (const p of pontosChatArray) {
    if (p < 0 && chatNegativeNeutralized < chatNegativeInTolerance) {
      chatNegativeNeutralized++;
    } else {
      pontosAjustadosChat += p;
    }
  }

  let pontosAjustadosLigacao = 0;
  let ligacaoNegativeNeutralized = 0;
  for (const p of pontosLigacaoArray) {
    if (p < 0 && ligacaoNegativeNeutralized < ligacaoNegativeInTolerance) {
      ligacaoNegativeNeutralized++;
    } else {
      pontosAjustadosLigacao += p;
    }
  }

  return {
    pontosAjustadosChat,
    pontosAjustadosLigacao,
    taxaToleranciaConta,
    errosComTolerancia: {
      quantidade: errosNeutralizados,
      pontos: -pontosPerdidosNeutrados,
    },
  };
}

export function calcularPontosChat(data: ProducaoData): number {
  return (
    data.chatNota5 * CHAT_SCORES[5] +
    data.chatNota4 * CHAT_SCORES[4] +
    data.chatNota3 * CHAT_SCORES[3] +
    data.chatNota2 * CHAT_SCORES[2] +
    data.chatNota1 * CHAT_SCORES[1]
  );
}

export function calcularPontosLigacao(data: ProducaoData): number {
  return (
    data.ligacaoExtrementeSatisfeito * LIGACAO_SCORES.extrementeSatisfeito +
    data.ligacaoExcelente * LIGACAO_SCORES.excelente +
    data.ligacaoBom * LIGACAO_SCORES.bom +
    data.ligacaoRegular * LIGACAO_SCORES.regular +
    data.ligacaoRuim * LIGACAO_SCORES.ruim +
    data.ligacaoPessimo * LIGACAO_SCORES.pessimo
  );
}

export function calcularMaxPontosChat(data: ProducaoData): number {
  const totalChatRatings =
    data.chatNota5 +
    data.chatNota4 +
    data.chatNota3 +
    data.chatNota2 +
    data.chatNota1;
  return totalChatRatings * 5;
}

export function calcularMaxPontosLigacao(data: ProducaoData): number {
  const totalLigacaoRatings =
    data.ligacaoExtrementeSatisfeito +
    data.ligacaoExcelente +
    data.ligacaoBom +
    data.ligacaoRegular +
    data.ligacaoRuim +
    data.ligacaoPessimo;
  return totalLigacaoRatings * 5;
}

export function calcularBonificacao(performance: number): number {
  for (const [minPerf, bonus] of BONIFICACAO_TABLE) {
    if (performance >= minPerf) {
      return bonus;
    }
  }
  return 0;
}

/**
 * CORRIGIDO: Verifica elegibilidade com os dois critérios corretos:
 *   1. performance >= 80%
 *   2. totalAtendimentos >= mediaAtendimentosTurno ajustada pela tolerância
 *      (mínimo = mediaAtendimentosTurno * (1 - tolerancia/100))
 *
 * @param performance            - Performance % do atendente
 * @param totalAtendimentos      - Total de atendimentos do atendente (chat + ligação)
 * @param mediaAtendimentosTurno - Média de atendimentos dos atendentes do mesmo turno
 * @param toleranciaAtendente    - % de tolerância personalizada (0 = sem tolerância)
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
 * CORRIGIDO: Calcula a média de ATENDIMENTOS (chat + ligação) do turno.
 * Antes calculava média de performance — o que estava errado para fins de elegibilidade.
 *
 * @param producoes - Lista de produções do mesmo turno no mesmo período
 * @returns Média de atendimentos totais por atendente no turno
 */
export function calcularMediaTurno(producoes: ProducaoData[]): number {
  if (producoes.length === 0) return 0;

  const totalAtendimentos = producoes.reduce(
    (sum, p) => sum + p.chatTotal + p.ligacaoTotal,
    0
  );

  return Math.round((totalAtendimentos / producoes.length) * 100) / 100;
}

/**
 * Cálculo completo de uma produção.
 *
 * @param data                   - Dados de produção com contagens de notas
 * @param mediaAtendimentosTurno - Média de atendimentos do turno (não performance)
 * @param toleranciaAtendente    - % de tolerância personalizada (0 = sem tolerância)
 */
export function calcularProducao(
  data: ProducaoData,
  mediaAtendimentosTurno: number = 0,
  toleranciaAtendente: number = 0
): CalculoResult {
  // 1. Pontos brutos
  const pontosChat = calcularPontosChat(data);
  const pontosLigacao = calcularPontosLigacao(data);
  const maxPontosChat = calcularMaxPontosChat(data);
  const maxPontosLigacao = calcularMaxPontosLigacao(data);
  const atendimentosTotais = data.chatTotal + data.ligacaoTotal;

  // 2. Aplica tolerância
  const { pontosChatArray, pontosLigacaoArray } = separarPontosPorTipo(data);
  const toleranceResult = aplicarMargemErroTolerance(
    pontosChatArray,
    pontosLigacaoArray,
    toleranciaAtendente
  );

  // 3. Performance %
  const pontosTotaisAjustados =
    toleranceResult.pontosAjustadosChat + toleranceResult.pontosAjustadosLigacao;
  const maxPontos = maxPontosChat + maxPontosLigacao;

  let performance = 0;
  if (maxPontos > 0) {
    performance = (pontosTotaisAjustados / maxPontos) * 100;
    performance = Math.round(performance * 100) / 100;
  }

  // 4. CORRIGIDO: passa totalAtendimentos e mediaAtendimentosTurno (não performance)
  const { elegivel, motivo } = verificarElegibilidade(
    performance,
    atendimentosTotais,
    mediaAtendimentosTurno,
    toleranciaAtendente
  );

  // 5. Bonificação só se elegível
  const bonificacao = elegivel ? calcularBonificacao(performance) : 0;

  return {
    pontosChat: Math.round(pontosChat * 100) / 100,
    pontosLigacao: Math.round(pontosLigacao * 100) / 100,
    pontosTotais: Math.round((pontosChat + pontosLigacao) * 100) / 100,
    maxPontosChat: Math.round(maxPontosChat * 100) / 100,
    maxPontosLigacao: Math.round(maxPontosLigacao * 100) / 100,
    maxPontosTotais: Math.round((maxPontosChat + maxPontosLigacao) * 100) / 100,
    atendimentosTotais,
    taxaToleranciaConta: toleranceResult.taxaToleranciaConta,
    errosComTolerancia: toleranceResult.errosComTolerancia,
    performance,
    bonificacao,
    elegivel,
    motivoNaoElegivel: motivo,
  };
}
