import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db-pg";
import { calcularProducao, calcularMediaTurno, verificarElegibilidade } from "../bonificacao";
import { executarVerificacoesNotificacoes } from "../notificacoes";

const producaoSchema = z.object({
  atendenteId: z.number(),
  mes: z.number().min(1).max(12),
  ano: z.number(),
  chatTotal: z.number().min(0),
  chatNota5: z.number().min(0),
  chatNota4: z.number().min(0),
  chatNota3: z.number().min(0),
  chatNota2: z.number().min(0),
  chatNota1: z.number().min(0),
  chatSemNota: z.number().min(0),
  ligacaoTotal: z.number().min(0),
  ligacaoExtrementeSatisfeito: z.number().min(0),
  ligacaoExcelente: z.number().min(0),
  ligacaoBom: z.number().min(0),
  ligacaoRegular: z.number().min(0),
  ligacaoRuim: z.number().min(0),
  ligacaoPessimo: z.number().min(0),
  semanas: z.any().optional(),
});

/**
 * Recalcula totais de produção a partir de semanas (historicoAtendimentos).
 * Usa os dados brutos como fonte de verdade quando a estrutura está completa.
 * Retorna null se semanas estiver vazio ou estrutura incompleta — nesse caso usa input.
 */
function recalcularTotaisDeSemanas(
  semanas: unknown,
  fallback: { chatTotal: number; chatNota5: number; chatNota4: number; chatNota3: number; chatNota2: number; chatNota1: number; chatSemNota: number; ligacaoTotal: number; ligacaoExtrementeSatisfeito: number; ligacaoExcelente: number; ligacaoBom: number; ligacaoRegular: number; ligacaoRuim: number; ligacaoPessimo: number }
): typeof fallback {
  if (!semanas || !Array.isArray(semanas) || semanas.length === 0) return fallback;

  let chatNota1 = 0, chatNota2 = 0, chatNota3 = 0, chatNota4 = 0, chatNota5 = 0, chatSemNota = 0;
  let ligacaoBom = 0, ligacaoRegular = 0, ligacaoRuim = 0, ligacaoPessimo = 0;
  let ligacaoExcelente = 0, ligacaoExtrementeSatisfeito = 0;
  let chatTotal = 0, ligacaoTotal = 0;

  for (const semanaRaw of semanas) {
    const atendimentosList = Array.isArray(semanaRaw)
      ? semanaRaw
      : semanaRaw && typeof semanaRaw === "object" && Array.isArray((semanaRaw as any).atendimentos)
        ? (semanaRaw as any).atendimentos
        : [];

    const totalChat = typeof (semanaRaw as any)?.totalChatAtendimentos === "number"
      ? (semanaRaw as any).totalChatAtendimentos
      : null;
    const totalLig = typeof (semanaRaw as any)?.totalLigacaoAtendimentos === "number"
      ? (semanaRaw as any).totalLigacaoAtendimentos
      : null;
    const n4 = Number((semanaRaw as any)?.chatNota4 ?? 0);
    const n5 = Number((semanaRaw as any)?.chatNota5 ?? 0);
    const ligExc = Number((semanaRaw as any)?.ligacaoExcelente ?? 0);
    const ligExt = Number((semanaRaw as any)?.ligacaoExtremamenteSatisfeito ?? (semanaRaw as any)?.ligacaoExtrementeSatisfeito ?? 0);

    const chatAtends = atendimentosList.filter((a: any) => !a?.retirarNota && (a?.tipo === "chat" || !a?.tipo));
    const n1 = chatAtends.filter((a: any) => String(a?.nota) === "1").length;
    const n2 = chatAtends.filter((a: any) => String(a?.nota) === "2").length;
    const n3 = chatAtends.filter((a: any) => String(a?.nota) === "3").length;

    const ligAtends = atendimentosList.filter((a: any) => !a?.retirarNota && a?.tipo === "ligacao");
    ligacaoBom += ligAtends.filter((a: any) => String(a?.nota) === "bom").length;
    ligacaoRegular += ligAtends.filter((a: any) => String(a?.nota) === "regular").length;
    ligacaoRuim += ligAtends.filter((a: any) => String(a?.nota) === "ruim").length;
    ligacaoPessimo += ligAtends.filter((a: any) => String(a?.nota) === "pessimo").length;

    chatNota1 += n1;
    chatNota2 += n2;
    chatNota3 += n3;
    chatNota4 += n4;
    chatNota5 += n5;
    ligacaoExcelente += ligExc;
    ligacaoExtrementeSatisfeito += ligExt;

    if (totalChat !== null) {
      const notasRegistradas = n1 + n2 + n3 + n4 + n5;
      chatSemNota += Math.max(0, totalChat - notasRegistradas);
      chatTotal += totalChat;
    }
    if (totalLig !== null) ligacaoTotal += totalLig;
  }

  const hasMetadata = chatTotal > 0 || ligacaoTotal > 0;
  if (!hasMetadata) return fallback;

  const derivedChatTotal = chatNota1 + chatNota2 + chatNota3 + chatNota4 + chatNota5 + chatSemNota;
  return {
    chatTotal: chatTotal > 0 ? chatTotal : derivedChatTotal,
    chatNota1,
    chatNota2,
    chatNota3,
    chatNota4,
    chatNota5,
    chatSemNota,
    ligacaoTotal: ligacaoTotal > 0 ? ligacaoTotal : ligacaoBom + ligacaoRegular + ligacaoRuim + ligacaoPessimo + ligacaoExcelente + ligacaoExtrementeSatisfeito,
    ligacaoExtrementeSatisfeito,
    ligacaoExcelente,
    ligacaoBom,
    ligacaoRegular,
    ligacaoRuim,
    ligacaoPessimo,
  };
}

/**
 * Helper: busca produções do turno e calcula a média de atendimentos.
 * CORRIGIDO: calcularMediaTurno agora retorna média de atendimentos (não de performance).
 */
async function getMediaAtendimentosTurno(
  turno: string,
  mes: number,
  ano: number
): Promise<number> {
  const producoesTurno = await db.getProducaoMensalByTurnoMesAno(turno as any, mes, ano);

  return calcularMediaTurno(
    producoesTurno.map((p) => ({
      chatTotal: p.chatTotal,
      chatNota5: p.chatNota5,
      chatNota4: p.chatNota4,
      chatNota3: p.chatNota3,
      chatNota2: p.chatNota2,
      chatNota1: p.chatNota1,
      ligacaoTotal: p.ligacaoTotal,
      ligacaoExtrementeSatisfeito: p.ligacaoExtrementeSatisfeito,
      ligacaoExcelente: p.ligacaoExcelente,
      ligacaoBom: p.ligacaoBom,
      ligacaoRegular: p.ligacaoRegular,
      ligacaoRuim: p.ligacaoRuim,
      ligacaoPessimo: p.ligacaoPessimo,
    }))
  );
}

export const producaoRouter = router({
  getByAtendente: protectedProcedure
    .input(
      z.object({
        atendenteId: z.number(),
        mes: z.number(),
        ano: z.number(),
      })
    )
    .query(async ({ input }) => {
      const result = await db.getProducaoMensalByAtendente(
        input.atendenteId,
        input.mes,
        input.ano
      );
      return result || null;
    }),

  getAtendimentosDetalhados: protectedProcedure
    .input(z.object({ producaoMensalId: z.number() }))
    .query(async ({ input }) => {
      return db.getAtendimentosDetalhados(input.producaoMensalId);
    }),

  getByMesAno: protectedProcedure
    .input(z.object({ mes: z.number(), ano: z.number() }))
    .query(async ({ input }) => {
      return db.getProducaoMensalByMesAno(input.mes, input.ano);
    }),

  getByTurnoMesAno: protectedProcedure
    .input(
      z.object({
        turno: z.enum(["A", "B", "C"]),
        mes: z.number(),
        ano: z.number(),
      })
    )
    .query(async ({ input }) => {
      return db.getProducaoMensalByTurnoMesAno(input.turno, input.mes, input.ano);
    }),

  getCompletedAtendentes: protectedProcedure
    .input(z.object({ mes: z.number(), ano: z.number() }))
    .query(async ({ input }) => {
      const producoes = await db.getProducaoMensalByMesAno(input.mes, input.ano);
      return producoes.map((p) => p.atendenteId);
    }),

  create: protectedProcedure
    .input(producaoSchema)
    .mutation(async ({ input }) => {
      const atendente = await db.getAtendenteById(input.atendenteId);
      if (!atendente) throw new TRPCError({ code: "NOT_FOUND", message: "Atendente não encontrado" });

      // Recalcula totais a partir de semanas quando disponível (fonte de verdade)
      const dataParaCalculo = recalcularTotaisDeSemanas(input.semanas, {
        chatTotal: input.chatTotal,
        chatNota5: input.chatNota5,
        chatNota4: input.chatNota4,
        chatNota3: input.chatNota3,
        chatNota2: input.chatNota2,
        chatNota1: input.chatNota1,
        chatSemNota: input.chatSemNota,
        ligacaoTotal: input.ligacaoTotal,
        ligacaoExtrementeSatisfeito: input.ligacaoExtrementeSatisfeito,
        ligacaoExcelente: input.ligacaoExcelente,
        ligacaoBom: input.ligacaoBom,
        ligacaoRegular: input.ligacaoRegular,
        ligacaoRuim: input.ligacaoRuim,
        ligacaoPessimo: input.ligacaoPessimo,
      });

      const mediaAtendimentosTurno = await getMediaAtendimentosTurno(
        atendente.turno,
        input.mes,
        input.ano
      );

      const toleranciaAtendente = parseFloat(atendente.tolerancia?.toString() || "0");

      const mergedData = { ...input, ...dataParaCalculo };
      const calculo = calcularProducao(
        mergedData,
        mediaAtendimentosTurno,
        toleranciaAtendente
      );

      const dataToInsert = {
        ...mergedData,
        pontosChat: calculo.pontosChat.toString(),
        pontosLigacao: calculo.pontosLigacao.toString(),
        pontosTotais: calculo.pontosTotais.toString(),
        maxPontosChat: calculo.maxPontosChat.toString(),
        maxPontosLigacao: calculo.maxPontosLigacao.toString(),
        maxPontosTotais: calculo.maxPontosTotais.toString(),
        atendimentosTotais: calculo.atendimentosTotais,
        performance: calculo.performance.toString(),
        bonificacao: calculo.bonificacao.toString(),
        elegivel: calculo.elegivel ? 1 : 0,
        motivoNaoElegivel: calculo.motivoNaoElegivel,
      };

      await db.createProducaoMensal(dataToInsert);

      const createdProducao = await db.getProducaoMensalByAtendente(
        input.atendenteId,
        input.mes,
        input.ano
      );
      const producaoMensalId = createdProducao?.id;

      if (!producaoMensalId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao obter ID da produção inserida" });
      }

      if (input.semanas && Array.isArray(input.semanas)) {
        const atendimentosArray: any[] = [];

        input.semanas.forEach((semanaRaw: any, semanaIndex: number) => {
          const atendimentosList = Array.isArray(semanaRaw)
            ? semanaRaw
            : semanaRaw && Array.isArray(semanaRaw.atendimentos)
              ? semanaRaw.atendimentos
              : [];

          atendimentosList.forEach((atendimento: any) => {
            if (
              atendimento &&
              atendimento.nota &&
              atendimento.nota !== "" &&
              atendimento.nota !== "0"
            ) {
              atendimentosArray.push({
                producaoMensalId,
                atendenteId: input.atendenteId,
                mes: input.mes,
                ano: input.ano,
                nomeCliente: atendimento.cliente || null,
                tipo: atendimento.tipo || "chat",
                nota: atendimento.nota && !isNaN(parseInt(atendimento.nota)) ? parseInt(atendimento.nota) : null,
                auditoria: atendimento.obs || null,
                massiva: atendimento.massiva ? 1 : 0,
                retirarNota: atendimento.retirarNota ? 1 : 0,
                dataAtendimento:
                  semanaRaw && semanaRaw.dataInicio ? semanaRaw.dataInicio : null,
              });
            }
          });
        });

        if (atendimentosArray.length > 0) {
          await db.createAtendimentosDetalhados(atendimentosArray);
        }
      }

      await executarVerificacoesNotificacoes(input.mes, input.ano);

      return { success: true, calculo, producaoMensalId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: producaoSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      const producao = await db.getProducaoMensalByAtendente(
        input.data.atendenteId || 0,
        input.data.mes || 0,
        input.data.ano || 0
      );

      if (!producao) throw new TRPCError({ code: "NOT_FOUND", message: "Produção não encontrada" });

      const atendente = await db.getAtendenteById(producao.atendenteId);
      if (!atendente) throw new TRPCError({ code: "NOT_FOUND", message: "Atendente não encontrado" });

      const mediaAtendimentosTurno = await getMediaAtendimentosTurno(
        atendente.turno,
        producao.mes,
        producao.ano
      );

      const baseMerge = { ...producao, ...input.data };
      const fallbackCounts = {
        chatTotal: baseMerge.chatTotal,
        chatNota5: baseMerge.chatNota5,
        chatNota4: baseMerge.chatNota4,
        chatNota3: baseMerge.chatNota3,
        chatNota2: baseMerge.chatNota2,
        chatNota1: baseMerge.chatNota1,
        chatSemNota: baseMerge.chatSemNota,
        ligacaoTotal: baseMerge.ligacaoTotal,
        ligacaoExtrementeSatisfeito: baseMerge.ligacaoExtrementeSatisfeito,
        ligacaoExcelente: baseMerge.ligacaoExcelente,
        ligacaoBom: baseMerge.ligacaoBom,
        ligacaoRegular: baseMerge.ligacaoRegular,
        ligacaoRuim: baseMerge.ligacaoRuim,
        ligacaoPessimo: baseMerge.ligacaoPessimo,
      };
      const dataParaCalculo = recalcularTotaisDeSemanas(input.data.semanas, fallbackCounts);
      const mergedData = { ...baseMerge, ...dataParaCalculo };

      const toleranciaAtendente = parseFloat(atendente.tolerancia?.toString() || "0");
      const calculo = calcularProducao(mergedData as any, mediaAtendimentosTurno, toleranciaAtendente);

      const dataToUpdate = {
        ...input.data,
        ...dataParaCalculo,
        pontosChat: calculo.pontosChat.toString(),
        pontosLigacao: calculo.pontosLigacao.toString(),
        pontosTotais: calculo.pontosTotais.toString(),
        maxPontosChat: calculo.maxPontosChat.toString(),
        maxPontosLigacao: calculo.maxPontosLigacao.toString(),
        maxPontosTotais: calculo.maxPontosTotais.toString(),
        atendimentosTotais: calculo.atendimentosTotais,
        performance: calculo.performance.toString(),
        bonificacao: calculo.bonificacao.toString(),
        elegivel: calculo.elegivel ? 1 : 0,
        motivoNaoElegivel: calculo.motivoNaoElegivel,
      };

      await db.updateProducaoMensal(input.id, dataToUpdate as any);

      if (input.data.semanas && Array.isArray(input.data.semanas)) {
        await db.deleteAtendimentosDetalhados(input.id);

        const atendimentosArray: any[] = [];

        input.data.semanas.forEach((semanaRaw: any) => {
          const atendimentosList = Array.isArray(semanaRaw)
            ? semanaRaw
            : semanaRaw && Array.isArray(semanaRaw.atendimentos)
              ? semanaRaw.atendimentos
              : [];

          atendimentosList.forEach((atendimento: any) => {
            if (
              atendimento &&
              atendimento.nota &&
              atendimento.nota !== "" &&
              atendimento.nota !== "0"
            ) {
              atendimentosArray.push({
                producaoMensalId: input.id,
                atendenteId: producao.atendenteId,
                mes: producao.mes,
                ano: producao.ano,
                nomeCliente: atendimento.cliente || null,
                tipo: atendimento.tipo || "chat",
                nota: atendimento.nota && !isNaN(parseInt(atendimento.nota)) ? parseInt(atendimento.nota) : null,
                auditoria: atendimento.obs || null,
                massiva: atendimento.massiva ? 1 : 0,
                retirarNota: atendimento.retirarNota ? 1 : 0,
                dataAtendimento:
                  semanaRaw && semanaRaw.dataInicio ? semanaRaw.dataInicio : null,
              });
            }
          });
        });

        if (atendimentosArray.length > 0) {
          await db.createAtendimentosDetalhados(atendimentosArray);
        }
      }

      return { success: true, calculo };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteProducaoMensal(input.id);
      return { success: true };
    }),

  /**
   * CORRIGIDO: debugElegibilidade usa a mesma lógica centralizada do bonificacao.ts
   * — média de atendimentos do turno, comparada com totalAtendimentos do atendente.
   */
  debugElegibilidade: protectedProcedure
    .input(z.object({ mes: z.number(), ano: z.number() }))
    .query(async ({ input }) => {
      const producoes = await db.getProducaoMensalByMesAno(input.mes, input.ano);
      const atendentes = await db.getAtendentes();

      return producoes.map((p) => {
        const atendente = atendentes.find((a) => a.id === p.atendenteId);
        const atendimentosTotais = p.chatTotal + p.ligacaoTotal;

        // Filtra produções do mesmo turno
        const producoesTurno = producoes.filter((prod) => {
          const att = atendentes.find((a) => a.id === prod.atendenteId);
          return att?.turno === atendente?.turno;
        });

        // CORRIGIDO: média de ATENDIMENTOS (não de performance)
        const mediaAtendimentosTurno = calcularMediaTurno(
          producoesTurno.map((pr) => ({
            chatTotal: pr.chatTotal,
            chatNota5: pr.chatNota5,
            chatNota4: pr.chatNota4,
            chatNota3: pr.chatNota3,
            chatNota2: pr.chatNota2,
            chatNota1: pr.chatNota1,
            ligacaoTotal: pr.ligacaoTotal,
            ligacaoExtrementeSatisfeito: pr.ligacaoExtrementeSatisfeito,
            ligacaoExcelente: pr.ligacaoExcelente,
            ligacaoBom: pr.ligacaoBom,
            ligacaoRegular: pr.ligacaoRegular,
            ligacaoRuim: pr.ligacaoRuim,
            ligacaoPessimo: pr.ligacaoPessimo,
          }))
        );

        const performance = parseFloat(p.performance as any);
        const toleranciaAtendente = parseFloat(atendente?.tolerancia?.toString() || "0");

        // CORRIGIDO: usa verificarElegibilidade com os 4 parâmetros corretos (incluindo tolerância)
        const { elegivel, motivo } = verificarElegibilidade(
          performance,
          atendimentosTotais,
          mediaAtendimentosTurno,
          toleranciaAtendente
        );

        return {
          atendenteId: p.atendenteId,
          atendenteName: atendente?.nome,
          turno: atendente?.turno,
          chatTotal: p.chatTotal,
          ligacaoTotal: p.ligacaoTotal,
          atendimentosTotais,
          performance: performance.toFixed(2),
          mediaAtendimentosTurno: mediaAtendimentosTurno.toFixed(2),
          elegivel,
          motivoNaoElegivel: motivo,
          bonificacao: parseFloat(p.bonificacao as any),
          pontosTotais: parseFloat(p.pontosTotais as any),
        };
      });
    }),

  recalcularProducaoAtendente: protectedProcedure
    .input(z.object({ atendenteId: z.number() }))
    .mutation(async ({ input }) => {
      const atendente = await db.getAtendenteById(input.atendenteId);
      if (!atendente) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Atendente não encontrado" });
      }

      const producoes = await db.getAllProducaoMensalByAtendente(input.atendenteId);
      const toleranciaAtendente = parseFloat(atendente.tolerancia?.toString() || "0");

      let updatedCount = 0;

      for (const producao of producoes) {
        const mediaAtendimentosTurno = await getMediaAtendimentosTurno(
          atendente.turno,
          producao.mes,
          producao.ano
        );

        // Reconstruct the data for calculation
        const dataParaCalculo = {
          chatTotal: producao.chatTotal,
          chatNota5: producao.chatNota5,
          chatNota4: producao.chatNota4,
          chatNota3: producao.chatNota3,
          chatNota2: producao.chatNota2,
          chatNota1: producao.chatNota1,
          chatSemNota: producao.chatSemNota,
          ligacaoTotal: producao.ligacaoTotal,
          ligacaoExtrementeSatisfeito: producao.ligacaoExtrementeSatisfeito,
          ligacaoExcelente: producao.ligacaoExcelente,
          ligacaoBom: producao.ligacaoBom,
          ligacaoRegular: producao.ligacaoRegular,
          ligacaoRuim: producao.ligacaoRuim,
          ligacaoPessimo: producao.ligacaoPessimo,
          semanas: producao.semanas,
        };

        const calculo = calcularProducao(dataParaCalculo, mediaAtendimentosTurno, toleranciaAtendente);

        // Update the production with all calculated fields (consistency with create/update)
        await db.updateProducaoMensal(producao.id, {
          pontosChat: calculo.pontosChat.toString(),
          pontosLigacao: calculo.pontosLigacao.toString(),
          pontosTotais: calculo.pontosTotais.toString(),
          maxPontosChat: calculo.maxPontosChat.toString(),
          maxPontosLigacao: calculo.maxPontosLigacao.toString(),
          maxPontosTotais: calculo.maxPontosTotais.toString(),
          performance: calculo.performance.toString(),
          bonificacao: calculo.bonificacao.toString(),
          elegivel: calculo.elegivel ? 1 : 0,
          motivoNaoElegivel: calculo.motivoNaoElegivel,
        });

        updatedCount++;
      }

      return { success: true, updatedCount };
    }),
});
