/**
 * Script de diagnóstico para verificar valores de bonificação no banco
 * Mostra os valores armazenados vs o que deveria ser
 */

import { getDb } from "./server/db";
import { calcularProducao } from "./server/bonificacao";

async function diagnosticar() {
  const db = await getDb();

  if (!db) {
    console.error("❌ Erro: Banco de dados não disponível");
    console.log("   Certifique-se de que DATABASE_URL está configurada");
    process.exit(1);
  }

  try {
    console.log("🔍 Iniciando diagnóstico de bonificações...\n");

    const { producaoMensal } = await import("./drizzle/schema");
    const { getAtendenteById } = await import("./server/db");

    // Buscar algumas produções para análise
    const producoes = await db.select().from(producaoMensal).limit(10);

    if (!producoes || producoes.length === 0) {
      console.log("ℹ️  Nenhuma produção encontrada no banco");
      process.exit(0);
    }

    console.log(`📊 Analisando ${producoes.length} produções...\n`);

    for (const p of producoes) {
      const atendente = await getAtendenteById(p.atendenteId);

      console.log(`\n─────────────────────────────────────────`);
      console.log(`Atendente: ${atendente?.nome || "N/A"}`);
      console.log(`Período: ${p.mes}/${p.ano}`);
      console.log(`─────────────────────────────────────────`);

      // Dados no banco
      console.log(`\n📁 DADOS NO BANCO:`);
      console.log(`   - bonificacao: R$ ${parseFloat(p.bonificacao?.toString() || "0").toFixed(2)}`);
      console.log(`   - performance: ${parseFloat(p.performance?.toString() || "0").toFixed(2)}%`);
      console.log(`   - elegivel: ${p.elegivel === 1 ? "✅ SIM" : "❌ NÃO"}`);
      console.log(`   - maxPontosChat: ${parseFloat(p.maxPontosChat?.toString() || "0").toFixed(2)}`);
      console.log(`   - maxPontosLigacao: ${parseFloat(p.maxPontosLigacao?.toString() || "0").toFixed(2)}`);
      console.log(`   - pontosTotais: ${parseFloat(p.pontosTotais?.toString() || "0").toFixed(2)}`);

      // Recalcular
      console.log(`\n🔄 RECALCULAR:`);
      const dataParaCalculo = {
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
      };

      const tolerancia = parseFloat(atendente?.tolerancia?.toString() || "0");
      const calculo = calcularProducao(dataParaCalculo, 0, tolerancia); // mediaAtendimentos = 0 para diagnóstico simples

      console.log(`   - bonificacao: R$ ${calculo.bonificacao.toFixed(2)}`);
      console.log(`   - performance: ${calculo.performance.toFixed(2)}%`);
      console.log(`   - elegivel: ${calculo.elegivel ? "✅ SIM" : "❌ NÃO"}`);
      console.log(`   - maxPontosChat: ${calculo.maxPontosChat.toFixed(2)}`);
      console.log(`   - maxPontosLigacao: ${calculo.maxPontosLigacao.toFixed(2)}`);
      console.log(`   - pontosTotais: ${calculo.pontosTotais.toFixed(2)}`);

      // Comparar
      const bonifDiff = Math.abs(calculo.bonificacao - parseFloat(p.bonificacao?.toString() || "0"));
      const perfDiff = Math.abs(calculo.performance - parseFloat(p.performance?.toString() || "0"));
      const maxChatDiff = Math.abs(calculo.maxPontosChat - parseFloat(p.maxPontosChat?.toString() || "0"));
      const maxLigDiff = Math.abs(calculo.maxPontosLigacao - parseFloat(p.maxPontosLigacao?.toString() || "0"));

      if (bonifDiff > 0.01 || perfDiff > 0.01 || maxChatDiff > 0.01 || maxLigDiff > 0.01) {
        console.log(`\n⚠️  DIVERGÊNCIAS ENCONTRADAS:`);
        if (bonifDiff > 0.01) console.log(`   - Bonificação: diferença de R$ ${bonifDiff.toFixed(2)}`);
        if (perfDiff > 0.01) console.log(`   - Performance: diferença de ${perfDiff.toFixed(2)}%`);
        if (maxChatDiff > 0.01) console.log(`   - MaxPontosChat: diferença de ${maxChatDiff.toFixed(2)}`);
        if (maxLigDiff > 0.01) console.log(`   - MaxPontosLigacao: diferença de ${maxLigDiff.toFixed(2)}`);
      } else {
        console.log(`\n✅ SEM DIVERGÊNCIAS - dados estão corretos`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro geral:", err);
    process.exit(1);
  }
}

diagnosticar();
