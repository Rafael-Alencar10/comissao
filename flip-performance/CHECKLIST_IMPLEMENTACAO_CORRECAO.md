# ✅ Checklist: Implementação da Correção de Bonificação no PDF

## 📋 Pré-Implementação

- [ ] Fazer backup do banco de dados
- [ ] Anotar a senha do MySQL/banco de dados
- [ ] Fechar a aplicação Flip Performance (se estiver rodando)

## 🚀 Implementação

### Fase 1: Aplicar Migration (Obrigatório)

- [ ] Abrir terminal no diretório do projeto
  ```powershell
  cd c:\FlipComissao\flip-performance
  ```

- [ ] Configurar variável de ambiente
  ```powershell
  $env:DATABASE_URL="mysql://seu_usuario:sua_senha@seu_host:3306/flip_performance"
  ```
  > Substitua `seu_usuario`, `sua_senha`, e `seu_host` pelos valores corretos

- [ ] Executar migration
  ```powershell
  npm run db:push
  ```

- [ ] Verificar se não houve erros
  - [ ] Mensagem "migration applied" ou similar
  - [ ] Nenhuma mensagem de erro

### Fase 2: Correção de Dados Históricos (Recomendado)

- [ ] Executar script de correção
  ```powershell
  npx tsx update-max-pontos.ts
  ```

- [ ] Verificar resultado
  - [ ] Vê mensagem "Buscando produções no banco de dados..."
  - [ ] Vê contagem de produções encontradas
  - [ ] Vê "Sucesso! XXX produções atualizadas"

- [ ] Se tiver erro de conexão:
  - [ ] Verifique se `$env:DATABASE_URL` está configurado
  - [ ] Verifique a senha do banco
  - [ ] Tente novamente

### Fase 3: Rebuild do Projeto (Recomendado)

- [ ] Fazer rebuild
  ```powershell
  npm run build
  ```

- [ ] Se houver erros:
  - [ ] Verifique se não há erros de sintaxe
  - [ ] Tente `npm install` para reinstalar dependências
  - [ ] Tente `npm run check` para validar tipos TypeScript

- [ ] Iniciar servidor de desenvolvimento
  ```powershell
  npm run dev
  ```

- [ ] Verifique se está rodando sem erros

## 🧪 Teste

### Teste 1: Novo Lançamento

- [ ] Abrir navegador em `http://localhost:5173` (ou URL correta)
- [ ] Fazer login
- [ ] Ir para **Lançamento de Produção**
- [ ] Selecionar um atendente
- [ ] Preencher dados de exemplo:
  - [ ] Chat: 5 chats (5 notas ⭐⭐⭐⭐⭐)
  - [ ] Ligação: 3 ligações (todas "Excelentes")
- [ ] Clicar em **Salvar**
- [ ] Mensagem de sucesso deve aparecer

### Teste 2: Exportação PDF

- [ ] Ir para **Gestão de Comissões**
- [ ] Selecionar o mês/turno com dados
- [ ] Clicar em **Exportar PDF**
- [ ] Abrir o PDF gerado
- [ ] Verificar:
  - [ ] Título e data estão corretos
  - [ ] Tabela mostra os atendentes
  - [ ] Coluna "Performance" tem valores coerentes (80%+)
  - [ ] Coluna "Bonificação" mostra valores em R$
  - [ ] **"Total Bônus" no topo está coerente** ✅

### Teste 3: Dados Históricos (Se Corrigidos)

- [ ] Ir para **Gestão de Comissões**
- [ ] Selecionar um mês antigo (antes da correção)
- [ ] Clicar em **Exportar PDF**
- [ ] Verificar se **"Total Bônus"** está correto

## 📊 Validação

### Verificação de Banco de Dados

- [ ] Conectar ao MySQL com um cliente (ex: MySQL Workbench)
- [ ] Buscar a tabela `producaoMensal`
- [ ] Verificar se tem as 3 novas colunas:
  - [ ] `maxPontosChat`
  - [ ] `maxPontosLigacao`
  - [ ] `maxPontosTotais`
- [ ] Verificar se tem valores > 0 nos registros

```sql
SELECT id, atendenteId, maxPontosChat, maxPontosLigacao, maxPontosTotais 
FROM producaoMensal 
LIMIT 10;
```

### Verificação de Código

- [ ] Arquivo `server/routers/export.ts` tem as modificações
  - [ ] Linha ~61: usa `parseFloat(p.maxPontosChat)`
  - [ ] Linha ~62: usa `parseFloat(p.maxPontosLigacao)`
  - [ ] Linha ~63: usa `parseFloat(p.maxPontosTotais)`

- [ ] Arquivo `server/routers/producao.ts` tem as modificações
  - [ ] Função `create`: salva `maxPontosChat`, `maxPontosLigacao`, `maxPontosTotais`
  - [ ] Função `update`: salva `maxPontosChat`, `maxPontosLigacao`, `maxPontosTotais`

## ✨ Conclusão

- [ ] Todos os testes passaram ✅
- [ ] PDF agora mostra valor total correto ✅
- [ ] Dados históricos foram corrigidos (se aplicável) ✅
- [ ] Sistema está funcionando normalmente ✅

---

## 🆘 Troubleshooting

### Erro: "DATABASE_URL não configurado"
```powershell
# Solução:
$env:DATABASE_URL="mysql://usuario:senha@host:3306/flip_performance"
```

### Erro: "Access denied for user"
```powershell
# Solução: Verifique a senha do MySQL
# Tente conectar direto com:
mysql -h seu_host -u seu_usuario -p
```

### Erro: "Table already exists"
```powershell
# Significa que a migration já foi aplicada
# Isso é normal! Você pode prosseguir com os testes
```

### PDF ainda mostra valor errado
- [ ] Verifique se `npm run db:push` foi executado com sucesso
- [ ] Verifique se `npx tsx update-max-pontos.ts` rodou com sucesso
- [ ] Tente fazer F5 (refresh) no navegador
- [ ] Tente fazer rebuild: `npm run build`

### Performance ainda está errada no PDF
- [ ] Verifique a coluna `maxPontosTotais` no banco
- [ ] Se estiver 0, execute o script de correção novamente
- [ ] Verifique se `server/routers/export.ts` tem as modificações

---

## 📞 Próximos Passos

Após completar o checklist:

1. **Monitorar:** Acompanhe o sistema por alguns dias
2. **Documentar:** Registre se havia dados divergentes antes e se foram corrigidos
3. **Backup:** Faça um backup após validar que está funcionando
4. **Comunicar:** Informe os usuários que a divergência foi corrigida

