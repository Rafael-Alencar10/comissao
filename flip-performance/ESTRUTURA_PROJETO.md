# Estrutura do Projeto — Flip Performance

> Documentação da arquitetura e estrutura do sistema de gestão de performance e comissões para atendentes de telemarketing.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Arquitetura de Alto Nível](#4-arquitetura-de-alto-nível)
5. [Frontend (Client)](#5-frontend-client)
6. [Backend (Server)](#6-backend-server)
7. [Banco de Dados](#7-banco-de-dados)
8. [Autenticação](#8-autenticação)
9. [API tRPC](#9-api-trpc)
10. [Fluxo de Dados](#10-fluxo-de-dados)
11. [Regras de Negócio](#11-regras-de-negócio)
12. [Build e Deploy](#12-build-e-deploy)

---

## 1. Visão Geral

**Flip Performance** é um sistema de gestão de performance e bonificação para atendentes de telemarketing. Permite:

- Rastrear produção de atendentes (chat + ligações)
- Calcular performance com base em notas de satisfação
- Determinar elegibilidade para bonificação
- Gerenciar atendentes, turnos e comissões
- Gerar relatórios e exportar PDF

O sistema é um **monorepo** com frontend React e backend Node.js, comunicação via tRPC (API tipada), banco PostgreSQL (Supabase) e deploy no Render.

---

## 2. Stack Tecnológico

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 19, Vite 7, TypeScript |
| **UI** | Radix UI, Tailwind CSS 4, shadcn/ui, Framer Motion, Recharts |
| **Roteamento** | Wouter |
| **Estado / API** | TanStack React Query, tRPC 11 (React Query) |
| **Formulários** | React Hook Form, Zod |
| **Backend** | Node.js, Express 4 |
| **API** | tRPC 11 (tipado end-to-end) |
| **Banco** | PostgreSQL (Supabase), Drizzle ORM |
| **Auth** | OAuth (Manus) e login por credenciais (JWT + bcrypt) |
| **Serialização** | superjson |
| **Build** | Vite (client), esbuild (server) |

---

## 3. Estrutura de Diretórios

```
flip-performance/
├── client/                     # Frontend React
│   ├── index.html
│   ├── public/                 # Arquivos estáticos
│   │   └── __manus__/          # Assets Manus
│   └── src/
│       ├── main.tsx            # Entry point
│       ├── App.tsx             # Componente raiz + rotas
│       ├── index.css           # Estilos globais
│       ├── const.ts            # Constantes (getLoginUrl, etc.)
│       ├── components/         # Componentes reutilizáveis
│       │   ├── ui/             # shadcn/Radix UI
│       │   └── ...             # Customizados
│       ├── contexts/           # ThemeContext, etc.
│       ├── hooks/              # useMobile, usePersistFn
│       ├── lib/                # tRPC client, elegibilidade.ts
│       ├── pages/              # Páginas (Dashboard, Atendentes, etc.)
│       └── _core/              # useAuth
│
├── server/                     # Backend Node.js
│   ├── _core/                  # Núcleo do servidor
│   │   ├── index.ts            # Entry Express
│   │   ├── context.ts          # Contexto tRPC (user)
│   │   ├── trpc.ts             # Procedures, middlewares
│   │   ├── oauth.ts            # Rotas OAuth callback
│   │   ├── sdk.ts              # Cliente OAuth (Manus)
│   │   ├── sessionCookie.ts    # JWT para credenciais
│   │   ├── cookies.ts          # Opções de cookie
│   │   ├── env.ts              # Variáveis de ambiente
│   │   └── vite.ts             # Dev: Vite / Prod: static
│   ├── db/
│   │   └── schema.ts           # Schema Drizzle (PostgreSQL)
│   ├── routers/                # Routers tRPC
│   │   ├── auth.ts
│   │   ├── atendentes.ts
│   │   ├── producao.ts
│   │   ├── notificacoes.ts
│   │   └── export.ts
│   ├── db-pg.ts                # Acesso ao banco (Drizzle)
│   ├── routers.ts              # Agregação dos routers
│   ├── bonificacao.ts          # Cálculo de performance e bonificação
│   ├── notificacoes.ts         # Lógica de notificações
│   ├── pdf-export.ts           # Exportação PDF
│   └── seed.ts                 # Seed do banco
│
├── shared/                     # Código compartilhado (client + server)
│   ├── const.ts                # COOKIE_NAME, ONE_YEAR_MS
│   ├── types.ts
│   └── bonificacao-rules.ts    # CHAT_SCORES, LIGACAO_SCORES, BONIFICACAO_TABLE
│
├── drizzle/                    # Migrations Drizzle
│   ├── 0000_*.sql              # SQL de migração
│   └── meta/_journal.json
│
├── scripts/                    # Scripts utilitários
├── patches/                    # Patches de dependências
│
├── package.json
├── vite.config.ts
├── drizzle.config.ts
└── .env
```

---

## 4. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLIP PERFORMANCE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [Browser]                    [Express]                    [PostgreSQL]    │
│                                                                             │
│   React + Vite  ──HTTP──►  /api/trpc (tRPC)  ──►  createContext (auth)      │
│   Wouter                    Batch requests         protectedProcedure       │
│   React Query  ◄──JSON──   routers (auth,           db-pg.ts (Drizzle)      │
│   (credentials)             atendentes,            Supabase                 │
│                             producao, etc.)                                 │
│                                                                             │
│   /api/oauth/callback  ──►  OAuth (Manus) ou JWT (credenciais)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de uma requisição

1. **Cliente**: `trpc.atendentes.list.useQuery()` → POST `/api/trpc` (batch)
2. **Express**: roteia para tRPC
3. **createContext**: lê cookie `app_session_id` → JWT ou OAuth → `ctx.user`
4. **Router**: `protectedProcedure` valida `ctx.user`
5. **Procedure**: chama `db.getAtendentes()` etc.
6. **Resposta**: superjson serializa → React Query atualiza UI

---

## 5. Frontend (Client)

### Páginas e rotas (Wouter)

| Rota | Componente | Função |
|------|------------|--------|
| `/` | Dashboard | Overview, KPIs, gráficos |
| `/atendentes` | Atendentes | CRUD de atendentes |
| `/lancamento` | Lancamento | Lançamento de produções |
| `/visao-turno` | VisaoTurno | Visão consolidada por turno |
| `/historico` | Historico | Histórico de produções |
| `/comissoes` | Comissoes | Comissões e bonificações |
| `/performance` | Performance | Dashboard individual |
| `/configuracoes` | Configuracoes | Configurações |
| `/login` | Login | Login por credenciais |

### Proteção de rotas

- `App.tsx` → `Router` usa `useAuth()` que chama `trpc.auth.me.useQuery()`
- Sem usuário autenticado → redireciona para `/login`
- Rotas protegidas envolvidas em `DashboardLayout`

### Componentes principais

- **lib/trpc.ts**: Cliente tRPC com `httpBatchLink`, `credentials: "include"`, superjson
- **lib/elegibilidade.ts**: Lógica de elegibilidade (espelha servidor)
- **components/ui/**: shadcn (Button, Dialog, Select, etc.)
- **_core/hooks/useAuth.ts**: `auth.me`, `auth.logout`, estado de loading/erro

---

## 6. Backend (Server)

### Servidor Express (`_core/index.ts`)

- Middlewares: `express.json`, `cookie-parser`
- Rotas:
  - `/api/oauth/callback` — callback OAuth
  - `/api/trpc` — API tRPC (batch)
- **Dev**: Vite como middleware (HMR)
- **Prod**: arquivos estáticos em `dist/public`

### Acesso ao banco (`db-pg.ts`)

- Usa Drizzle ORM + driver `postgres`
- Conexão via `DATABASE_URL` (Supabase)
- Funções: `getAtendentes`, `upsertProducaoMensal`, `getProducaoByAtendente`, etc.

### Lógica de negócio

- **bonificacao.ts**: `calcularProducao`, `calcularMediaTurno`, `verificarElegibilidade`, `calcularBonificacao`
- **notificacoes.ts**: `executarVerificacoesNotificacoes` (desempenho, elegibilidade, meta)

---

## 7. Banco de Dados

### Driver e ORM

- **PostgreSQL** (Supabase)
- **Drizzle ORM**
- Schema em `server/db/schema.ts`
- Migrations em `drizzle/`

### Tabelas (schema.ts)

| Tabela | Função |
|--------|--------|
| **users** | Usuários OAuth (openId, name, email, role) |
| **userCredentials** | Login por usuário/senha (username, passwordHash, role) |
| **atendentes** | Nome, turno (A/B/C), tipoAtuacao (Chat/Ligação/Ambos), status, tolerância |
| **producaoMensal** | Produção mensal (chat/ligação totais, notas, pontos, performance, bonificação, elegível) |
| **atendimentosDetalhados** | Detalhe por atendimento (data, cliente, tipo, nota, auditoria) |
| **notificacoes** | Notificações por atendente (tipo, titulo, mensagem, lida) |

### ENUMs

- `role`: user, admin
- `turno`: A, B, C
- `tipoAtuacao`: Chat, Ligacao, Ambos
- `tipoAtendimento`: chat, ligacao
- `tipoNotificacao`: desempenho_baixo, elegibilidade_alterada, meta_atingida, alerta_geral

---

## 8. Autenticação

### Dois fluxos suportados

#### 1. OAuth (Manus)

- `getLoginUrl()` em `client/src/const.ts` monta URL do portal OAuth
- Usuário redirecionado → callback `/api/oauth/callback`
- SDK troca `code` por token, obtém user info
- `upsertUser` no banco, define cookie `app_session_id`, redireciona para `/`

#### 2. Credenciais (usuário/senha)

- Formulário em `/login` → `trpc.auth.login.mutate()`
- Validação em `userCredentials` (bcrypt)
- Sessão assinada com JWT em `sessionCookie.ts`
- Cookie `app_session_id` com `signAuthSession`

### Contexto tRPC (`createContext`)

1. Lê cookie `app_session_id`
2. Se presente → `verifyAuthSession` (JWT) → `ctx.user` (AuthUser)
3. Se não → `sdk.authenticateRequest` (OAuth) → `ctx.user` (User)
4. `ctx.user` pode ser `User | AuthUser | null`

### Middlewares de auth

- **publicProcedure**: sem autenticação
- **protectedProcedure**: exige `ctx.user`
- **adminProcedure**: exige `ctx.user.role === 'admin'`

---

## 9. API tRPC

### Routers e procedures

| Router | Procedures principais |
|--------|------------------------|
| **system** | health, notifyOwner |
| **auth** | login, me, logout, createUser, listUsers, updateUser, deleteUser |
| **atendentes** | list, getById, create, update, delete, listByTurno, listByStatus |
| **producao** | getByAtendente, getByTurnoMesAno, upsert, recalcular, getAtendimentosDetalhados |
| **notificacoes** | getByAtendente, getNaoLidas, marcarComoLida, criar |
| **export** | producaoPDF |

### Exemplo de uso no cliente

```typescript
const { data } = trpc.atendentes.list.useQuery();
const mutate = trpc.producao.upsert.useMutation({
  onSuccess: () => utils.producao.getByTurnoMesAno.invalidate(),
});
```

---

## 10. Fluxo de Dados

### Lançamento de produção

```
[Lancamento.tsx]
  → trpc.producao.upsert.mutate({ atendenteId, mes, ano, semanas, ... })
  → POST /api/trpc

[producao.upsert]
  → recalcularTotaisDeSemanas(semanas)
  → calcularProducao (bonificacao.ts)
  → verificarElegibilidade
  → executarVerificacoesNotificacoes
  → db.upsertProducaoMensal
  → db.upsertAtendimentosDetalhados
```

### Cálculo de performance

1. **Pontos**: soma por notas (CHAT_SCORES, LIGACAO_SCORES)
2. **Tolerância**: neutraliza parte dos pontos negativos (margem de erro)
3. **Performance**: `(pontosAjustados / maxPontos) × 100`
4. **Média do turno**: média das performances do turno
5. **Elegibilidade**: performance ≥ 80% **e** performance > média do turno
6. **Bonificação**: tabela BONIFICACAO_TABLE (100%→R$500, 96%→R$400, etc.)

---

## 11. Regras de Negócio

### Pontuação (shared/bonificacao-rules.ts)

**Chat (notas 1–5):**

| Nota | Pontos |
|------|--------|
| 5 | +5 |
| 4 | +2 |
| 3 | -3 |
| 2 | -10 |
| 1 | -10 |

**Ligação (6 categorias):**

| Categoria | Pontos |
|-----------|--------|
| Extremamente satisfeito | +5 |
| Excelente | +2 |
| Bom | +1 |
| Regular | 0 |
| Ruim | -10 |
| Péssimo | -10 |

### Tabela de bonificação

| Performance | Valor (R$) |
|-------------|------------|
| 100% | 500 |
| 96% | 400 |
| 90% | 300 |
| 86% | 200 |
| 80% | 100 |
| < 80% | 0 |

### Elegibilidade

- Performance ≥ 80%
- Performance > média do turno

---

## 12. Build e Deploy

### Scripts (package.json)

| Script | Comando | Função |
|--------|---------|--------|
| dev | `tsx watch server/_core/index.ts` | Servidor em modo desenvolvimento |
| build | `vite build && esbuild server/...` | Build do cliente + servidor |
| start | `node dist/index.js` | Servidor em produção |
| db:push | `drizzle-kit generate && migrate` | Gerar e aplicar migrations |
| db:seed | `tsx server/seed.ts` | Popular banco com dados de teste |

### Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| DATABASE_URL | Conexão PostgreSQL (Supabase) |
| JWT_SECRET | Assinatura do JWT |
| OAUTH_SERVER_URL | URL base do OAuth (backend) |
| VITE_OAUTH_PORTAL_URL | URL do portal OAuth (frontend) |
| VITE_APP_ID | ID da aplicação |
| VITE_DISABLE_AUTH | Desabilitar auth (dev) |
| DISABLE_AUTH | Desabilitar auth no servidor |

### Deploy

- **Plataforma**: Render (ou similar)
- **Banco**: Supabase (PostgreSQL)
- Build: `npm run build` → `dist/public` + `dist/index.js`

---

**Última atualização**: Março 2025
