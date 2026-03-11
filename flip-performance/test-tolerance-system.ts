#!/usr/bin/env npx ts-node
/**
 * Script para demonstrar o sistema de tolerância personalizada
 * 
 * Execução:
 * npx ts-node test-tolerance-system.ts
 */

import { calcularProducao, ProducaoData } from "./server/bonificacao";

// Dados de exemplo de um atendente
const producaoExample: ProducaoData = {
  chatTotal: 100,
  chatNota5: 40,    // 40 atendimentos com nota 5 (excelente)
  chatNota4: 30,    // 30 com nota 4 (bom)
  chatNota3: 15,    // 15 com nota 3 (regular)
  chatNota2: 10,    // 10 com nota 2 (fraco)
  chatNota1: 5,     // 5 com nota 1 (péssimo)
  ligacaoTotal: 50,
  ligacaoExtrementeSatisfeito: 20,  // 20 extremamente satisfeito
  ligacaoExcelente: 15,             // 15 excelente
  ligacaoBom: 10,                   // 10 bom
  ligacaoRegular: 3,                // 3 regular
  ligacaoRuim: 1,                   // 1 ruim
  ligacaoPessimo: 1,                // 1 péssimo
};

const mediaDoTurno = 80; // Média de atendimentos do turno

console.log("==============================================");
console.log("Sistema de Tolerância Personalizada - Teste");
console.log("==============================================\n");

console.log("📊 Dados de Produção:");
console.log(`  Chat Total: ${producaoExample.chatTotal}`);
console.log(`  Ligação Total: ${producaoExample.ligacaoTotal}`);
console.log(`  Total de Atendimentos: ${producaoExample.chatTotal + producaoExample.ligacaoTotal}`);
console.log(`  Média do Turno: ${mediaDoTurno}\n`);

// Teste 1: Sem tolerância personalizada (usa padrão 5%)
console.log("------- Teste 1: Sem Tolerância Personalizada -------");
const calculo1 = calcularProducao(producaoExample, mediaDoTurno, 0);
console.log(`Tolerância Personalizada: 0% (usa padrão 5%)`);
console.log(`Taxa de Tolerância: 5% = ${calculo1.taxaToleranciaConta} erros permitidos`);
console.log(`Pontos Chat: ${calculo1.pontosChat}`);
console.log(`Pontos Ligação: ${calculo1.pontosLigacao}`);
console.log(`Performance: ${calculo1.performance.toFixed(2)}%`);
console.log(`Elegível: ${calculo1.elegivel ? "✅ Sim" : "❌ Não"}`);
console.log(`Bonificação: R$ ${calculo1.bonificacao.toFixed(2)}\n`);

// Teste 2: Tolerância reduzida 3% (mais rigoroso)
console.log("------- Teste 2: Tolerância Reduzida (3%) -------");
const calculo2 = calcularProducao(producaoExample, mediaDoTurno, 3);
console.log(`Tolerância Personalizada: 3%`);
console.log(`Taxa de Tolerância: 3% = ${calculo2.taxaToleranciaConta} erros permitidos`);
console.log(`Pontos Chat: ${calculo2.pontosChat}`);
console.log(`Pontos Ligação: ${calculo2.pontosLigacao}`);
console.log(`Performance: ${calculo2.performance.toFixed(2)}%`);
console.log(`Elegível: ${calculo2.elegivel ? "✅ Sim" : "❌ Não"}`);
console.log(`Bonificação: R$ ${calculo2.bonificacao.toFixed(2)}\n`);

// Teste 3: Tolerância aumentada 8% (menos rigoroso)
console.log("------- Teste 3: Tolerância Aumentada (8%) -------");
const calculo3 = calcularProducao(producaoExample, mediaDoTurno, 8);
console.log(`Tolerância Personalizada: 8%`);
console.log(`Taxa de Tolerância: 8% = ${calculo3.taxaToleranciaConta} erros permitidos`);
console.log(`Pontos Chat: ${calculo3.pontosChat}`);
console.log(`Pontos Ligação: ${calculo3.pontosLigacao}`);
console.log(`Performance: ${calculo3.performance.toFixed(2)}%`);
console.log(`Elegível: ${calculo3.elegivel ? "✅ Sim" : "❌ Não"}`);
console.log(`Bonificação: R$ ${calculo3.bonificacao.toFixed(2)}\n`);

// Comparação
console.log("------- Comparação de Resultados -------");
console.log(`\nImpacto da Tolerância no Exemplo:`);
console.log(`  3% (Rigoroso):    Performance = ${calculo2.performance.toFixed(2)}%  |  Bonificação = R$ ${calculo2.bonificacao.toFixed(2)}`);
console.log(`  5% (Padrão):      Performance = ${calculo1.performance.toFixed(2)}%  |  Bonificação = R$ ${calculo1.bonificacao.toFixed(2)}`);
console.log(`  8% (Flexível):    Performance = ${calculo3.performance.toFixed(2)}%  |  Bonificação = R$ ${calculo3.bonificacao.toFixed(2)}`);

console.log("\n✨ Sistema de Tolerância Personalizada testado com sucesso!");
console.log("==============================================\n");
