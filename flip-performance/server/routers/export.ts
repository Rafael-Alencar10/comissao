import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
// use Postgres-specific database helper
import * as db from "../db-pg";
import { generateProductionPDFBuffer } from "../pdf-export";

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
});
