import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
// switch to PostgreSQL implementation when using Supabase
import * as db from "../db-pg";

const atendenteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  turno: z.enum(["A", "B", "C"]),
  tipoAtuacao: z.enum(["Chat", "Ligacao", "Ambos"]),
  status: z.enum(["Ativo", "Inativo"]),
  tolerancia: z.number().min(0).max(100).optional().default(0),
});

export const atendentesRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getAtendentes();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getAtendenteById(input.id);
    }),

  create: protectedProcedure
    .input(atendenteSchema)
    .mutation(async ({ input }) => {
      await db.createAtendente(input);
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: atendenteSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateAtendente(input.id, input.data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteAtendente(input.id);
      return { success: true };
    }),

  listByTurno: protectedProcedure
    .input(z.object({ turno: z.enum(["A", "B", "C"]) }))
    .query(async ({ input }) => {
      return db.getAtendentesByTurno(input.turno);
    }),

  listByStatus: protectedProcedure
    .input(z.object({ status: z.enum(["Ativo", "Inativo"]) }))
    .query(async ({ input }) => {
      return db.getAtendentesByStatus(input.status);
    }),
});
