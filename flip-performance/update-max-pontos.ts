/**
 * Script para corrigir dados históricos de maxPontosChat e maxPontosLigacao
 * A partir dos campos de notas individuais (chatNota5, chatNota4, etc.)
 * 
 * Uso: npx tsx update-max-pontos.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import { producaoMensal } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function updateMaxPontos() {
  // Conectar diretamente ao banco
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL não configurado");
    process.exit(1);
  }

  const db = drizzle(DATABASE_URL);

  try {
    // Buscar todas as produções do banco
    console.log("Buscando produções no banco de dados...");
    const producoes = await db.select().from(producaoMensal).execute();

    console.log(`Encontradas ${producoes.length} produções para atualizar...`);

    let updated = 0;

    for (const p of producoes) {
      // Calcular maxPontosChat
      const totalChatNotas =
        (p.chatNota5 || 0) +
        (p.chatNota4 || 0) +
        (p.chatNota3 || 0) +
        (p.chatNota2 || 0) +
        (p.chatNota1 || 0);

      const maxPontosChat = totalChatNotas * 5;

      // Calcular maxPontosLigacao
      const totalLigacaoNotas =
        (p.ligacaoExtrementeSatisfeito || 0) +
        (p.ligacaoExcelente || 0) +
        (p.ligacaoBom || 0) +
        (p.ligacaoRegular || 0) +
        (p.ligacaoRuim || 0) +
        (p.ligacaoPessimo || 0);

      const maxPontosLigacao = totalLigacaoNotas * 5;
      const maxPontosTotais = maxPontosChat + maxPontosLigacao;

      // Atualizar o banco
      await db.update(producaoMensal)
        .set({
          maxPontosChat: maxPontosChat.toString(),
          maxPontosLigacao: maxPontosLigacao.toString(),
          maxPontosTotais: maxPontosTotais.toString(),
        })
        .where(eq(producaoMensal.id, p.id))
        .execute();

      updated++;
      if (updated % 10 === 0) {
        console.log(`  ✓ ${updated} produções atualizadas...`);
      }
    }

    console.log(`\n✅ Sucesso! ${updated} produções atualizadas com maxPontos corretos.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao atualizar dados:", error);
    process.exit(1);
  }
}

updateMaxPontos();
