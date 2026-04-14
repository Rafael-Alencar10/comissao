import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
// use Postgres-specific database helper
import * as db from "../db-pg";
import { generateProductionPDFBuffer, generateLancamentoPDFBuffer } from "../pdf-export";

export const exportRouter = router({
  producaoPDF: protectedProcedure
    .input(
      z.object({
        mes: z.number().min(1).max(12),
        ano: z.number(),
        turno: z.enum(["A", "B", "C"]).optional(),
        atendenteId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let producoes: any[] = [];

      // Get producoes with atendente names
      if (input.turno) {
        producoes = await db.getProducaoMensalByTurnoMesAno(
          input.turno,
          input.mes,
          input.ano
        );
      } else {
        const allProducoes = await db.getProducaoMensalByMesAno(
          input.mes,
          input.ano
        );
        // Get atendente names for each producao
        for (const p of allProducoes) {
          const atendente = await db.getAtendenteById(p.atendenteId);
          producoes.push({
            ...p,
            atendenteName: atendente?.nome || "N/A",
            atendenteTurno: atendente?.turno || "N/A",
          });
        }
      }

      // Filter by atendente if provided
      if (input.atendenteId) {
        producoes = producoes.filter((p) => p.atendenteId === input.atendenteId);
      }

      // Map to export data format
      const exportData = producoes.map((p) => ({
        atendenteNome: p.atendenteName || "N/A",
        turno: p.atendenteTurno || "N/A",
        mes: p.mes,
        ano: p.ano,
        chatTotal: p.chatTotal,
        ligacaoTotal: p.ligacaoTotal,
        pontosChat: parseFloat(p.pontosChat),
        pontosLigacao: parseFloat(p.pontosLigacao),
        pontosTotais: parseFloat(p.pontosTotais),
        maxPontosChat: parseFloat(p.maxPontosChat) || (p.chatTotal * 5), // Fallback para dados antigos
        maxPontosLigacao: parseFloat(p.maxPontosLigacao) || (p.ligacaoTotal * 5), // Fallback para dados antigos
        maxPontosTotais: parseFloat(p.maxPontosTotais) || ((p.chatTotal + p.ligacaoTotal) * 5), // Fallback para dados antigos
        performance: parseFloat(p.performance),
        elegivel: p.elegivel === 1,
        bonificacao: parseFloat(p.bonificacao),
        motivoNaoElegivel: p.motivoNaoElegivel,
      }));

      if (exportData.length === 0) {
        throw new Error("Nenhum registro encontrado para exportação");
      }

      const pdfBuffer = generateProductionPDFBuffer(
        exportData,
        input.mes,
        input.ano,
        input.turno
      );

      return {
        buffer: pdfBuffer.toString("base64"),
        filename: `producao_${input.mes}_${input.ano}${input.turno ? `_turno_${input.turno}` : ""}.pdf`,
      };
    }),

  lancamentoPDF: protectedProcedure
    .input(
      z.object({
        atendenteId: z.number(),
        mes: z.number().min(1).max(12),
        ano: z.number(),
        // Dados do lançamento
        chatTotal: z.number(),
        chatNota5: z.number(),
        chatNota4: z.number(),
        chatNota3: z.number(),
        chatNota2: z.number(),
        chatNota1: z.number(),
        ligacaoTotal: z.number(),
        ligacaoExtrementeSatisfeito: z.number(),
        ligacaoExcelente: z.number(),
        ligacaoBom: z.number(),
        ligacaoRegular: z.number(),
        ligacaoRuim: z.number(),
        ligacaoPessimo: z.number(),
        semanas: z.array(z.object({
          start: z.string().nullable(),
          end: z.string().nullable(),
          atendimentos: z.array(z.object({
            cliente: z.string(),
            obs: z.string(),
            nota: z.string(),
            massiva: z.boolean(),
            retirarNota: z.boolean(),
            tipo: z.enum(["chat", "ligacao"]),
          })),
        })),
        // Cálculos
        mediaDoTurno: z.number(),
        performance: z.number(),
        pontosTotais: z.number(),
        bonificacao: z.number(),
        elegivel: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      // Get atendente info
      const atendente = await db.getAtendenteById(input.atendenteId);
      if (!atendente) {
        throw new Error("Atendente não encontrado");
      }

      const pdfBuffer = generateLancamentoPDFBuffer({
        atendenteNome: atendente.nome,
        atendenteTurno: atendente.turno,
        mes: input.mes,
        ano: input.ano,
        mediaDoTurno: input.mediaDoTurno,
        semanas: input.semanas,
        chatTotal: input.chatTotal,
        chatNota5: input.chatNota5,
        chatNota4: input.chatNota4,
        chatNota3: input.chatNota3,
        chatNota2: input.chatNota2,
        chatNota1: input.chatNota1,
        ligacaoTotal: input.ligacaoTotal,
        ligacaoExtrementeSatisfeito: input.ligacaoExtrementeSatisfeito,
        ligacaoExcelente: input.ligacaoExcelente,
        ligacaoBom: input.ligacaoBom,
        ligacaoRegular: input.ligacaoRegular,
        ligacaoRuim: input.ligacaoRuim,
        ligacaoPessimo: input.ligacaoPessimo,
        performance: input.performance,
        pontosTotais: input.pontosTotais,
        bonificacao: input.bonificacao,
        elegivel: input.elegivel,
      });

      return {
        buffer: pdfBuffer.toString("base64"),
        filename: `lancamento_${atendente.nome}_${input.mes}_${input.ano}.pdf`,
      };
    }),
});
