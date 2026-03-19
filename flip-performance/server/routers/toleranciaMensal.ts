import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db-pg";

export const toleranciaMensalRouter = router({
  /** Retorna tolerâncias por atendente para um mês/ano */
  getByMesAno: protectedProcedure
    .input(z.object({ mes: z.number().min(1).max(12), ano: z.number() }))
    .query(async ({ input }) => {
      return db.getToleranciaMensalPorMesAno(input.mes, input.ano);
    }),

  /** Cria ou atualiza tolerância para um atendente em um mês. Tolerância > 5% exige justificativa. */
  upsert: protectedProcedure
    .input(
      z.object({
        atendenteId: z.number(),
        mes: z.number().min(1).max(12),
        ano: z.number(),
        tolerancia: z.number().min(0).max(100),
        justificativaToleranciaAlta: z.string().max(1000).nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { tolerancia, justificativaToleranciaAlta } = input;
      if (tolerancia > 5 && (!justificativaToleranciaAlta || !justificativaToleranciaAlta.trim())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tolerância maior que 5% exige justificativa. Preencha o campo na aba Performance.",
        });
      }
      await db.upsertToleranciaMensal({
        atendenteId: input.atendenteId,
        mes: input.mes,
        ano: input.ano,
        tolerancia: input.tolerancia,
        justificativaToleranciaAlta: justificativaToleranciaAlta?.trim() || null,
      });
      return { success: true };
    }),
});
