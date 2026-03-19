# Guia para testar localmente antes de subir para produção

Este guia explica como testar as alterações localmente usando o Supabase antes do deploy no Render.

---

## Opções para testar

### Opção 1: Usar o mesmo banco Supabase (mais simples)

Use a mesma `DATABASE_URL` do projeto em produção no seu `.env` local.

**Vantagens:** Sem configuração extra, migrações testadas no banco real.  
**Cuidados:** Você está alterando o banco de produção. Faça backup antes de rodar migrations.

**Passos:**
1. Copie a `DATABASE_URL` do Render (Environment) ou use a do Supabase Dashboard
2. Cole no seu `.env` local
3. Rode as migrations (veja abaixo)

---

### Opção 2: Projeto Supabase separado para desenvolvimento (recomendado)

Crie um segundo projeto no Supabase só para desenvolvimento.

**Vantagens:** Isolamento total; pode testar migrations e dados sem risco para produção.  
**Passos:**
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto (ex: `flip-performance-dev`)
2. Em Settings → Database, copie a Connection string (URI)
3. Crie `.env.local` ou altere `.env` com essa URL
4. Rode as migrations no novo banco

---

### Opção 3: Supabase local (Docker)

Rode PostgreSQL e outros serviços do Supabase localmente via Docker.

**Passos:**
1. Instale o [Supabase CLI](https://supabase.com/docs/guides/cli): `npm install -g supabase`
2. No projeto: `npx supabase init`
3. Inicie os serviços: `npx supabase start`
4. Use a connection string exibida no terminal no seu `.env`

---

## Rodando a migration localmente

### 1. Aplicar a migration

Com `DATABASE_URL` configurado no `.env`:

```bash
cd flip-performance
npx drizzle-kit migrate
```

Ou, se preferir gerar e aplicar:

```bash
npx drizzle-kit push
```

A migration `0001_tolerancia_mensal.sql` cria a tabela `toleranciaMensal`.

### 2. Testar o app

```bash
npm run dev
```

O servidor sobe em `http://localhost:3000`.

### 3. Conferir a tabela no Supabase

1. Acesse o Supabase Dashboard
2. Table Editor
3. Confirme a existência da tabela `toleranciaMensal`

---

## Checklist antes do deploy

- [ ] Migration rodada localmente sem erro
- [ ] App inicia e abre corretamente
- [ ] Aba Performance: coluna de tolerância e justificativa funcionando
- [ ] Tolerância > 5% exige justificativa ao salvar
- [ ] Tolerância aplicada apenas ao mês selecionado
- [ ] Demais abas (Dashboard, Comissões, Histórico, Visão Turno) mostrando dados corretos

---

## Deploy para produção (Render)

1. Commite as alterações
2. Envie para o repositório
3. Rode a migration no banco de produção:
   - Pelo Render: variável `DATABASE_URL` já configurada
   - Pode ser via script de deploy ou manualmente:

```bash
# Com DATABASE_URL do Render configurada
DATABASE_URL="sua-url-producao" npx drizzle-kit migrate
```

Ou use o SQL Editor do Supabase para executar o conteúdo de `drizzle/0001_tolerancia_mensal.sql`.

---

## Rollback (se precisar reverter)

Para remover a tabela `toleranciaMensal`:

```sql
DROP TABLE IF EXISTS "toleranciaMensal";
```

**Nota:** O código passa a assumir tolerância 0 quando não há registro em `toleranciaMensal`, então o sistema continua funcionando sem essa tabela, usando o fallback de `atendentes.tolerancia`.
