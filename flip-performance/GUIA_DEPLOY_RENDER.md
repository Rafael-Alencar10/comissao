# Guia de Deploy para Render

## Pré-requisitos

1. Conta no [Render](https://render.com)
2. Repositório no GitHub conectado
3. **Banco de dados PostgreSQL gratuito no [Supabase](https://supabase.com)** (recomendado)

## Passos para Deploy

### 1. Preparar o Banco de Dados

#### Opção Recomendada: Supabase (Gratuito)

1. Crie projeto no [supabase.com](https://supabase.com)
2. Vá para Settings → Database
3. Copie a Connection String
4. Use no `.env` como `DATABASE_URL`

**Vantagens do Supabase:**
- 500MB banco gratuito
- PostgreSQL moderno
- Auth e API prontas
- Dashboard web para gerenciar dados

#### Alternativas Pagas:
- **PlanetScale**: MySQL gerenciado
- **Railway**: MySQL/PostgreSQL
- **AWS RDS**: MySQL/PostgreSQL

Configure as variáveis de ambiente no Render com a `DATABASE_URL` do seu banco.

### 2. Configurar o Projeto no Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em "New" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure o serviço:

**Configurações Básicas:**
- **Name**: flip-performance (ou nome desejado)
- **Runtime**: Node
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

**Variáveis de Ambiente:**
Adicione estas variáveis (Environment → Environment). Use o `.env.example` como referência:

```
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
JWT_SECRET=sua-chave-secreta-forte-aqui
VITE_APP_ID=flip-performance-prod
NODE_ENV=production
OAUTH_SERVER_URL=https://seu-app.render.com
VITE_OAUTH_PORTAL_URL=https://seu-app.render.com
VITE_ANALYTICS_ENDPOINT=https://seu-app.render.com
VITE_ANALYTICS_WEBSITE_ID=prod
DISABLE_AUTH=false
VITE_DISABLE_AUTH=false
```

**Avançado:**
- **Health Check Path**: `/api/trpc/health` (se você tiver um endpoint de health)
- **Auto-Deploy**: Ative para deploy automático em push para main

### 3. Primeiro Deploy

1. Clique em "Create Web Service"
2. O Render irá:
   - Clonar o repositório
   - Instalar dependências (`npm install`)
   - Executar build (`npm run build`)
   - Iniciar o servidor (`npm start`)

### 4. Executar Migrações do Banco

Após o deploy, execute as migrações no Supabase:

```bash
# Localmente ou via script
npx drizzle-kit generate --config drizzle-pg.config.ts
npx drizzle-kit migrate --config drizzle-pg.config.ts
```

Ou use o SQL Editor do Supabase para executar as migrações geradas.

### 4. Verificar o Deploy

Após o deploy, acesse a URL fornecida pelo Render. O app deve estar rodando.

### 5. Configurações Adicionais

#### Banco de Dados
- Execute as migrações do Drizzle: `npm run db:migrate` (pode fazer localmente ou via script)
- Certifique-se que o banco está acessível da internet

#### Domínio Customizado (opcional)
- Em Settings → Custom Domain, adicione seu domínio
- Configure DNS conforme instruções

#### Logs e Monitoramento
- Acesse "Logs" no dashboard para ver logs em tempo real
- Configure alertas se necessário

## Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Certifique-se que o `npm run build` funciona localmente

### Erro de Banco
- Verifique a `DATABASE_URL`
- Certifique-se que o firewall do banco permite conexões do Render (IPs do Render)

### App não carrega
- Verifique se o `NODE_ENV=production`
- Certifique-se que os arquivos estáticos estão sendo servidos

## Custos

- **Web Service**: Gratuito (750 horas/mês) ou $7/mês
- **Banco**: Dependendo do provedor (PlanetScale tem tier gratuito)

## Comandos Úteis

```bash
# Testar build localmente
npm run build

# Testar servidor localmente
npm start

# Verificar variáveis
echo $DATABASE_URL
```