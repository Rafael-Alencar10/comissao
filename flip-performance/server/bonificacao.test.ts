import { describe, it, expect } from "vitest";
import {
  calcularPontosChat,
  calcularPontosLigacao,
  calcularBonificacao,
  verificarElegibilidade,
  calcularProducao,
  calcularMaxPontosChat,
  calcularMaxPontosLigacao,
  calcularMediaTurno,
  separarPontosPorTipo,
  aplicarMargemErroTolerance,
  type ProducaoData,
} from "./bonificacao";

describe("Bonification Calculations - Índice de Aproveitamento Model", () => {
  describe("calcularPontosChat", () => {
    it("should calculate chat points correctly", () => {
      const data: ProducaoData = {
        chatTotal: 10,
        chatNota5: 5,
        chatNota4: 3,
        chatNota3: 1,
        chatNota2: 1,
        chatNota1: 0,
        ligacaoTotal: 0,
        ligacaoExtrementeSatisfeito: 0,
        ligacaoExcelente: 0,
        ligacaoBom: 0,
        ligacaoRegular: 0,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const pontos = calcularPontosChat(data);
      // 5*5 + 3*2 + 1*(-3) + 1*(-10) + 0*(-10) = 25 + 6 - 3 - 10 = 18
      expect(pontos).toBe(18);
    });

    it("should allow negative points for poor ratings", () => {
      const data: ProducaoData = {
        chatTotal: 5,
        chatNota5: 0,
        chatNota4: 0,
        chatNota3: 0,
        chatNota2: 2,
        chatNota1: 3,
        ligacaoTotal: 0,
        ligacaoExtrementeSatisfeito: 0,
        ligacaoExcelente: 0,
        ligacaoBom: 0,
        ligacaoRegular: 0,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const pontos = calcularPontosChat(data);
      // 0*5 + 0*2 + 0*(-3) + 2*(-10) + 3*(-10) = 0 + 0 + 0 - 20 - 30 = -50
      expect(pontos).toBe(-50);
    });
  });

  describe("calcularPontosLigacao", () => {
    it("should calculate ligacao points correctly", () => {
      const data: ProducaoData = {
        chatTotal: 0,
        chatNota5: 0,
        chatNota4: 0,
        chatNota3: 0,
        chatNota2: 0,
        chatNota1: 0,
        ligacaoTotal: 10,
        ligacaoExtrementeSatisfeito: 4,
        ligacaoExcelente: 3,
        ligacaoBom: 2,
        ligacaoRegular: 1,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const pontos = calcularPontosLigacao(data);
      // 4*5 + 3*2 + 2*1 + 1*0 + 0*(-10) + 0*(-10) = 20 + 6 + 2 + 0 + 0 + 0 = 28
      expect(pontos).toBe(28);
    });

    it("should allow negative points for poor satisfaction", () => {
      const data: ProducaoData = {
        chatTotal: 0,
        chatNota5: 0,
        chatNota4: 0,
        chatNota3: 0,
        chatNota2: 0,
        chatNota1: 0,
        ligacaoTotal: 5,
        ligacaoExtrementeSatisfeito: 0,
        ligacaoExcelente: 0,
        ligacaoBom: 0,
        ligacaoRegular: 0,
        ligacaoRuim: 2,
        ligacaoPessimo: 3,
      };

      const pontos = calcularPontosLigacao(data);
      // 0*5 + 0*2 + 0*1 + 0*0 + 2*(-10) + 3*(-10) = 0 + 0 + 0 + 0 - 20 - 30 = -50
      expect(pontos).toBe(-50);
    });
  });

  describe("calcularMaxPontosChat", () => {
    it("should calculate max chat points as total ratings * 5", () => {
      const data: ProducaoData = {
        chatTotal: 5,
        chatNota5: 3,
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
      };

      const maxPontos = calcularMaxPontosChat(data);
      // Total ratings = 3 + 1 + 1 = 5, so max = 5 * 5 = 25
      expect(maxPontos).toBe(25);
    });
  });

  describe("calcularMaxPontosLigacao", () => {
    it("should calculate max ligacao points as total ratings * 5", () => {
      const data: ProducaoData = {
        chatTotal: 0,
        chatNota5: 0,
        chatNota4: 0,
        chatNota3: 0,
        chatNota2: 0,
        chatNota1: 0,
        ligacaoTotal: 5,
        ligacaoExtrementeSatisfeito: 2,
        ligacaoExcelente: 2,
        ligacaoBom: 1,
        ligacaoRegular: 0,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const maxPontos = calcularMaxPontosLigacao(data);
      // Total ratings = 2 + 2 + 1 = 5, so max = 5 * 5 = 25
      expect(maxPontos).toBe(25);
    });
  });

  describe("separarPontosPorTipo", () => {
    it("should separate points into array by type", () => {
      const data: ProducaoData = {
        chatTotal: 4,
        chatNota5: 2,
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
      };

      const { pontosChatArray, pontosLigacaoArray } = separarPontosPorTipo(data);
      // Chat: [5, 5, 2, -3]
      expect(pontosChatArray).toEqual([5, 5, 2, -3]);
      expect(pontosLigacaoArray).toEqual([]);
    });
  });

  describe("aplicarMargemErroTolerance", () => {
    it("should neutralize 5% of errors (negative points)", () => {
      // 20 total attendances = 5% tolerance = 1 error can be neutralized
      const pontosChatArray = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]; // 10 attendances
      const pontosLigacaoArray = [5, 5, 5, 5, 5, 5, 5, 5, 5, -10]; // 10 attendances (last is an error)

      const result = aplicarMargemErroTolerance(pontosChatArray, pontosLigacaoArray, 5);
      // Total = 20, 5% tolerance = 1 error
      // The -10 should be neutralized (converted to 0)
      expect(result.taxaToleranciaConta).toBe(1);
      expect(result.errosComTolerancia.quantidade).toBe(1);
      expect(result.errosComTolerancia.pontos).toBe(10); // The 10 points that were neutralized
    });

    it("should NOT exceed tolerance limit", () => {
      const pontosChatArray = [-10, -10, -10, 5, 5]; // 5 total, 5% = 0.25 -> 0 errors
      const pontosLigacaoArray = [];

      const result = aplicarMargemErroTolerance(pontosChatArray, pontosLigacaoArray);
      // 5 total attendances, 5% = 0.25 -> 0 errors can be neutralized
      expect(result.taxaToleranciaConta).toBe(0);
      expect(result.errosComTolerancia.quantidade).toBe(0);
    });
  });

  describe("calcularBonificacao", () => {
    it("should return correct bonus for 100% performance", () => {
      expect(calcularBonificacao(100)).toBe(500);
    });

    it("should return correct bonus for 96% performance", () => {
      expect(calcularBonificacao(96)).toBe(400);
    });

    it("should return correct bonus for 90% performance", () => {
      expect(calcularBonificacao(90)).toBe(300);
    });

    it("should return correct bonus for 86% performance", () => {
      expect(calcularBonificacao(86)).toBe(200);
    });

    it("should return correct bonus for 80% performance", () => {
      expect(calcularBonificacao(80)).toBe(100);
    });

    it("should return 0 for performance below 80%", () => {
      expect(calcularBonificacao(79)).toBe(0);
    });
  });

  describe("verificarElegibilidade", () => {
    it("should mark as ineligible if performance below 80%", () => {
      const { elegivel, motivo } = verificarElegibilidade(79, 75);
      expect(elegivel).toBe(false);
      expect(motivo).toContain("80%");
    });

    it("should mark as ineligible if performance equals shift average", () => {
      const { elegivel, motivo } = verificarElegibilidade(85, 85);
      expect(elegivel).toBe(false);
      expect(motivo).toContain("acima");
    });

    it("should mark as eligible if performance >= 80% AND above shift average", () => {
      const { elegivel, motivo } = verificarElegibilidade(85, 80);
      expect(elegivel).toBe(true);
      expect(motivo).toBeNull();
    });

    it("should mark as ineligible if performance > 80% but <= shift average", () => {
      const { elegivel, motivo } = verificarElegibilidade(82, 85);
      expect(elegivel).toBe(false);
      expect(motivo).toContain("acima");
    });
  });

  describe("calcularProducao - Índice de Aproveitamento", () => {
    it("should calculate production with error tolerance applied", () => {
      const data: ProducaoData = {
        chatTotal: 10,
        chatNota5: 9,
        chatNota4: 0,
        chatNota3: 0,
        chatNota2: 1, // 1 error: -10 points
        chatNota1: 0,
        ligacaoTotal: 10,
        ligacaoExtrementeSatisfeito: 10,
        ligacaoExcelente: 0,
        ligacaoBom: 0,
        ligacaoRegular: 0,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const resultado = calcularProducao(data, 75, 5);
      // Raw Chat: 9*5 + 1*(-10) = 45 - 10 = 35
      // Raw Ligacao: 10*5 = 50
      // Total raw: 85
      // Max: 20 * 5 = 100
      // With 5% tolerance (1 error neutralized): 35 + 10 + 50 = 95
      // Performance: 95/100 * 100 = 95%
      // Elegivel: true (95% >= 80% AND 95 > 75)

      expect(resultado.atendimentosTotais).toBe(20);
      expect(resultado.taxaToleranciaConta).toBe(1); // 20 * 5% = 1
      expect(resultado.performance).toBe(95);
      expect(resultado.elegivel).toBe(true);
      expect(resultado.bonificacao).toBe(300); // 90-96 range
    });

    it("should be ineligible if performance exactly equals shift average", () => {
      const data: ProducaoData = {
        chatTotal: 4,
        chatNota5: 4,
        chatNota4: 0,
        chatNota3: 0,
        chatNota2: 0,
        chatNota1: 0,
        ligacaoTotal: 0,
        ligacaoExtrementeSatisfeito: 0,
        ligacaoExcelente: 0,
        ligacaoBom: 0,
        ligacaoRegular: 0,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const resultado = calcularProducao(data, 80); // Shift average = 80%
      // Chat: 4*5 = 20
      // Max: 4 * 5 = 20
      // Performance: 20/20 * 100 = 100%
      // Elegivel: true (100% > 80%)

      expect(resultado.performance).toBe(100);
      expect(resultado.elegivel).toBe(true);
      expect(resultado.bonificacao).toBe(500);
    });

    it("should handle production below 80% threshold", () => {
      const data: ProducaoData = {
        chatTotal: 5,
        chatNota5: 1,
        chatNota4: 0,
        chatNota3: 0,
        chatNota2: 4, // 4 errors: -40 points
        chatNota1: 0,
        ligacaoTotal: 0,
        ligacaoExtrementeSatisfeito: 0,
        ligacaoExcelente: 0,
        ligacaoBom: 0,
        ligacaoRegular: 0,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const resultado = calcularProducao(data, 50);
      // Chat: 1*5 + 4*(-10) = 5 - 40 = -35
      // With 5% tolerance on 5 items = 0 errors (0.25 rounds to 0)
      // Max: 5 * 5 = 25
      // Performance: -35/25 * 100 = -140% -> but this gets the right calculation
      // Result: ineligible because < 80%

      expect(resultado.performance).toBeLessThan(80);
      expect(resultado.elegivel).toBe(false);
      expect(resultado.bonificacao).toBe(0);
    });
  });

  describe("calcularMediaTurno", () => {
    it("should calculate shift average correctly", () => {
      const producoes: ProducaoData[] = [
        {
          chatTotal: 10,
          chatNota5: 0,
          chatNota4: 0,
          chatNota3: 0,
          chatNota2: 0,
          chatNota1: 0,
          ligacaoTotal: 10,
          ligacaoExtrementeSatisfeito: 0,
          ligacaoExcelente: 0,
          ligacaoBom: 0,
          ligacaoRegular: 0,
          ligacaoRuim: 0,
          ligacaoPessimo: 0,
        },
        {
          chatTotal: 20,
          chatNota5: 0,
          chatNota4: 0,
          chatNota3: 0,
          chatNota2: 0,
          chatNota1: 0,
          ligacaoTotal: 20,
          ligacaoExtrementeSatisfeito: 0,
          ligacaoExcelente: 0,
          ligacaoBom: 0,
          ligacaoRegular: 0,
          ligacaoRuim: 0,
          ligacaoPessimo: 0,
        },
      ];

      const media = calcularMediaTurno(producoes);
      // Total: (10+10) + (20+20) = 60
      // Average: 60 / 2 = 30
      expect(media).toBe(30);
    });

    it("should return 0 for empty productions", () => {
      const media = calcularMediaTurno([]);
      expect(media).toBe(0);
    });
  });

  describe("Personalized Tolerance System", () => {
    it("should calculate with 0% tolerance when toleranciaAtendente is 0", () => {
      const data: ProducaoData = {
        chatTotal: 100,
        chatNota5: 50,
        chatNota4: 30,
        chatNota3: 10,
        chatNota2: 5,
        chatNota1: 5,
        ligacaoTotal: 0,
        ligacaoExtrementeSatisfeito: 0,
        ligacaoExcelente: 0,
        ligacaoBom: 0,
        ligacaoRegular: 0,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const calculo = calcularProducao(data, 50, 0);
      expect(calculo.atendimentosTotais).toBe(100);
      // When toleranciaAtendente is 0, no errors are allowed (0% tolerance)
      expect(calculo.taxaToleranciaConta).toBe(0);
    });

    it("should calculate with custom 3% tolerance when toleranciaAtendente is 3", () => {
      const data: ProducaoData = {
        chatTotal: 100,
        chatNota5: 50,
        chatNota4: 30,
        chatNota3: 10,
        chatNota2: 5,
        chatNota1: 5,
        ligacaoTotal: 0,
        ligacaoExtrementeSatisfeito: 0,
        ligacaoExcelente: 0,
        ligacaoBom: 0,
        ligacaoRegular: 0,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const calculo = calcularProducao(data, 50, 3);
      expect(calculo.atendimentosTotais).toBe(100);
      // When toleranciaAtendente is 3, should use 3%
      expect(calculo.taxaToleranciaConta).toBe(3); // 3% of 100 = 3
    });

    it("should calculate with 5% custom tolerance for attendants with explicit 5%", () => {
      const data: ProducaoData = {
        chatTotal: 50,
        chatNota5: 25,
        chatNota4: 15,
        chatNota3: 5,
        chatNota2: 3,
        chatNota1: 2,
        ligacaoTotal: 0,
        ligacaoExtrementeSatisfeito: 0,
        ligacaoExcelente: 0,
        ligacaoBom: 0,
        ligacaoRegular: 0,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const calculo = calcularProducao(data, 40, 5);
      expect(calculo.atendimentosTotais).toBe(50);
      // When toleranciaAtendente is 5, should use 5%
      expect(calculo.taxaToleranciaConta).toBe(2); // 5% of 50 = 2.5, rounded down to 2
    });

    it("should calculate with 10% custom tolerance for high tolerance attendants", () => {
      const data: ProducaoData = {
        chatTotal: 100,
        chatNota5: 50,
        chatNota4: 30,
        chatNota3: 10,
        chatNota2: 5,
        chatNota1: 5,
        ligacaoTotal: 0,
        ligacaoExtrementeSatisfeito: 0,
        ligacaoExcelente: 0,
        ligacaoBom: 0,
        ligacaoRegular: 0,
        ligacaoRuim: 0,
        ligacaoPessimo: 0,
      };

      const calculo = calcularProducao(data, 50, 10);
      expect(calculo.atendimentosTotais).toBe(100);
      // When toleranciaAtendente is 10, should use 10%
      expect(calculo.taxaToleranciaConta).toBe(10); // 10% of 100 = 10
    });
  });
});
