import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
// redirect to PostgreSQL implementation
import * as db from "../db-pg";

export const notificacoesRouter = router({
  getByAtendente: protectedProcedure
    .input(
      z.object({
        atendenteId: z.number(),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      return db.getNotificacoesByAtendente(input.atendenteId, input.limit);
    }),

  getNaoLidas: protectedProcedure
    .input(
      z.object({
        atendenteId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return db.getNotificacoesNaoLidas(input.atendenteId);
    }),

  getRecentes: protectedProcedure
    .input(
      z.object({
        mes: z.number(),
        ano: z.number(),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input }) => {
      return db.getNotificacoesRecentes(input.mes, input.ano, input.limit);
    }),

  marcarComoLida: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await db.marcarNotificacaoComoLida(input.id);
      return { success: true };
    }),

  criar: protectedProcedure
    .input(
      z.object({
        atendenteId: z.number(),
        tipo: z.enum(["desempenho_baixo", "elegibilidade_alterada", "meta_atingida", "alerta_geral"]),
        titulo: z.string(),
        mensagem: z.string(),
        mes: z.number().optional(),
        ano: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await db.createNotificacao({
        atendenteId: input.atendenteId,
        tipo: input.tipo,
        titulo: input.titulo,
        mensagem: input.mensagem,
        mes: input.mes || null,
        ano: input.ano || null,
        lida: 0,
      });
      return { success: true };
    }),
});
