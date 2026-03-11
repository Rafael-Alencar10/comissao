/**
 * Regras centralizadas de bonificação e pontuação.
 * Usado por server/bonificacao.ts, client/lib/elegibilidade.ts e componentes.
 */

export const CHAT_SCORES: Record<number, number> = {
  5: 5,
  4: 2,
  3: -3,
  2: -10,
  1: -10,
};

export const LIGACAO_SCORES: Record<string, number> = {
  extrementeSatisfeito: 5,
  excelente: 2,
  bom: 1,
  regular: 0,
  ruim: -10,
  pessimo: -10,
};

/** Tabela [performance_min%, valor_bonificação_R$] */
export const BONIFICACAO_TABLE: Array<[number, number]> = [
  [100, 500],
  [96, 400],
  [90, 300],
  [86, 200],
  [80, 100],
  [0, 0],
];
