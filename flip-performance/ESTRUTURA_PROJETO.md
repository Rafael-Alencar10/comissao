# 📁 Estrutura Completa do Projeto Flip Performance

## 🎯 Visão Geral do Projeto

**Flip Performance** é um sistema de gestão de performance e bonificação para atendentes de telemarketing. O projeto permite:
- Rastrear performance de atendentes (chat + ligações)
- Calcular elegibilidade para bonificação baseada em desempenho
- Gerar relatórios e análises
- Gerenciar comissões e bonificações

---


## 📂 Estrutura de Diretórios

```
flip-performance/
├── client/                          # Frontend React + TypeScript
├── server/                          # Backend Node.js + tRPC
├── drizzle/                         # Migrações e Schema do Banco
├── scripts/                         # Scripts utilitários
├── patches/                         # Patches para dependências
└── [Arquivos de Configuração]
```

---

## 🎨 PASTA: `/client`

### Descrição
Frontend React com TypeScript. Contém todas as páginas, componentes e lógica de UI.

### Estrutura Interna

```
client/
├── index.html                       # Arquivo HTML principal
├── public/                          # Arquivos estáticos públicos
│   └── __manus__/                  # Assets privados/dados
├── src/
│   ├── main.tsx                     # Ponto de entrada React
│   ├── App.tsx                      # Componente raiz da aplicação
│   ├── index.css                    # Estilos globais
│   ├── const.ts                     # Constantes globais
│   ├── _core/                       # Configuração base
│   │   ├── index.ts                 # Exportações centralizadas
│   │   ├── context.ts               # Contextos React globais
│   │   └── ... (utils de configuração)
│   ├── components/                  # Componentes reutilizáveis (UI)
│   │   ├── ui/                      # Componentes Radix UI
│   │   └── ... (componentes customizados)
│   ├── constants/                   # Constantes da aplicação
│   ├── contexts/                    # Contextos React (Estado Global)
│   ├── hooks/                       # Custom React Hooks
│   ├── lib/                         # Funções utilitárias
│   │   └── elegibilidade.ts         # 🔑 LÓGICA DE ELEGIBILIDADE
│   ├── pages/                       # Páginas principais (rotas)
│   └── assets/                      # Imagens, ícones, etc
```

### 📄 Arquivos Principais do `/client`

#### `index.html`
- Arquivo HTML raiz
- Define o `<div id="root">` onde React monta
- Importa styles globais

#### `src/main.tsx`
- Ponto de entrada da aplicação React
- Configura o cliente tRPC
- Renderiza o componente `<App />`

#### `src/App.tsx`
- Componente raiz
- Define rotas com React Router
- Setup de providers (React Query, etc)

#### `src/const.ts`
- Constantes globais da aplicação
- URLs de API
- Valores padrão

#### `src/_core/`
- Configuração de integração com servidor
- Contextos e hooks globais
- Setup de bibliotecas

#### `src/components/`
- **`ui/`**: Componentes básicos do Radix UI (Button, Dialog, etc)
- **Customizados**: Componentes específicos do negócio

#### `src/lib/elegibilidade.ts` 🔑 CRÍTICO
```typescript
// Lógica compartilhada de elegibilidade para bonificação
export function verificarElegibilidade(performance, mediaDoTurno)
export function calcularPerformance(data)
export function calcularElegibilidade(data, mediaDoTurno)
```

**Função**: Calcula se um atendente é elegível para bonificação
- **Critério 1**: Performance >= 80%
- **Critério 2**: Performance > Média do Turno

#### `src/pages/` - PÁGINAS PRINCIPAIS

##### 1. **Performance.tsx**
- **Função**: Dashboard individual de performance
- **O que mostra**:
  - Performance % do atendente
  - Comparação com média do turno
  - Elegibilidade para bonificação
  - Histórico de performance
- **Dados**: Dados do atendente logado
- **Cálculos**:
  - Performance = (Pontos Totais / Pontos Máximos) × 100
  - Média do Turno = Média das performances do turno
  - Elegibilidade = `performance >= 80 AND performance > mediaDoTurno`

##### 2. **Comissoes.tsx**
- **Função**: Gerenciamento de comissões/bonificações
- **O que mostra**:
  - Lista de atendentes com elegibilidade
  - Bonificação de cada um
  - Filtros por mês/ano/turno
  - Recalculation em tempo real
- **Dados**: Todas as produções do período
- **Cálculos**:
  - Recalcula elegibilidade usando `verificarElegibilidade()`
  - Calcula bonificação baseada na performance
  - Tabela: 100%=R$500, 96%=R$400, 90%=R$300, 86%=R$200, 80%=R$100

##### 3. **Historico.tsx**
- **Função**: Histórico de produções
- **O que mostra**:
  - Todas as produções por atendente
  - Performance de cada período
  - Elegibilidade recalculada
  - Filtros avançados
- **Dados**: Todas as produções
- **Cálculos**:
  - Recalcula performance e elegibilidade
  - Agrega dados por período

##### 4. **VisaoTurno.tsx**
- **Função**: Visão consolidada por turno
- **O que mostra**:
  - Atendentes do turno (A, B, C)
  - Performance individual
  - Elegibilidade por turno
  - Métricas do turno
- **Dados**: Produções filtradas por turno
- **Cálculos**:
  - Performance individual
  - Média do turno
  - Elegibilidade baseada na média

##### 5. **Dashboard.tsx**
- **Função**: Overview geral da empresa
- **O que mostra**:
  - KPIs gerais (total de atendimentos, bonificação total, etc)
  - Gráficos de performance por turno
  - Elegíveis vs Não elegíveis (Pie Chart)
  - Tendências
- **Dados**: Todas as produções
- **Cálculos**:
  - Agregação de dados
  - Recalculation em tempo real com `useMemo`

##### 6. **Lancamento.tsx**
- **Função**: Lançamento de produções/notes
- **O que mostra**:
  - Formulário para registrar novas produções
  - Validações
  - Cálculo de performance em tempo real

##### 7. **Atendentes.tsx**
- **Função**: Gerenciamento de atendentes
- **O que mostra**:
  - CRUD de atendentes
  - Informações pessoais
  - Turno, status, tolerância personalizada
  - Histórico

#### `src/hooks/`
- Custom React Hooks
- Lógica reutilizável
- Queries e mutations tRPC

#### `src/contexts/`
- Contextos React para estado global
- Autenticação
- Configurações

---

## 🖥️ PASTA: `/server`

### Descrição
Backend Node.js com tRPC. Gerencia banco de dados, lógica de negócio e APIs.

### Estrutura Interna

```
server/
├── _core/                           # Configuração base do servidor
│   ├── index.ts                     # Ponto de entrada
│   ├── trpc.ts                      # Configuração tRPC
│   ├── context.ts                   # Contexto tRPC (usuário, DB, etc)
│   ├── dataApi.ts                   # Integração com APIs externas
│   ├── env.ts                       # Variáveis de ambiente
│   ├── llm.ts                       # Integração com IA/LLM
│   ├── oauth.ts                     # Autenticação OAuth
│   ├── systemRouter.ts              # Rotas de sistema
│   └── ... (outros utilitários)
├── routers/                         # Rotas tRPC (endpoints)
│   ├── producao.ts                  # CRUD de produções
│   ├── atendentes.ts                # CRUD de atendentes
│   ├── auth.ts                      # Autenticação
│   ├── comissoes.ts                 # Lógica de comissões
│   └── ... (outras rotas)
├── bonificacao.ts                   # 🔑 CÁLCULOS DE BONIFICAÇÃO
├── elegibilidade.test.ts            # 🔑 TESTES DE ELEGIBILIDADE
├── db.ts                            # Configuração do Drizzle ORM
├── routers.ts                       # Agrupa todas as rotas
├── seed.ts                          # Script para popular DB com dados
├── auth.logout.test.ts              # Testes de logout
├── bonificacao.test.ts              # Testes de bonificação
├── lancamento.test.ts               # Testes de lançamentos
├── notificacoes.ts                  # Sistema de notificações
├── pdf-export.ts                    # Exportação para PDF
├── storage.ts                       # Gerenciamento de arquivos (S3)
└── public/                          # Arquivos estáticos servidos
```

### 📄 Arquivos Principais do `/server`

#### `_core/index.ts`
- Ponto de entrada do servidor
- Inicializa Express
- Define rotas básicas
- Conecta tRPC

#### `_core/trpc.ts`
- Configuração do tRPC
- Define `createCallerFactory`
- Setup de middlewares

#### `_core/context.ts`
- Cria contexto para cada request
- Passa usuário, DB, etc
- Valida autenticação

#### `_core/env.ts`
- Variáveis de ambiente
- Validação com Zod
- Tipos TypeScript

#### `routers.ts`
- Agrega todas as rotas
- Cria router tRPC final
- Exporta tipos para client

#### `db.ts`
- Configuração do Drizzle ORM
- Conexão com MySQL
- Pool de conexões

#### `bonificacao.ts` 🔑 CRÍTICO

**Contém todas as funções de cálculo:**

```typescript
// Cálculos de pontos
export function calcularPontosChat(data)
export function calcularPontosLigacao(data)
export function calcularMaxPontosChat(data)
export function calcularMaxPontosLigacao(data)

// Aplicação de tolerância
export function aplicarMargemErroTolerance(pontosChatArray, pontosLigacaoArray, tolerancia)

// Cálculos principais
export function calcularProducao(data, mediaDoTurno, tolerancia)
export function calcularMediaTurno(producoes)  // 🔑 RETORNA MÉDIA DE PERFORMANCE
export function calcularBonificacao(performance)

// Elegibilidade
export function verificarElegibilidade(performance, mediaDoTurno)
```

**Lógica de Pontuação:**
- **Chat (Notas 1-5)**:
  - Nota 5: +5 pontos
  - Nota 4: +2 pontos
  - Nota 3: -3 pontos
  - Nota 2: -10 pontos
  - Nota 1: -10 pontos

- **Ligações (6 categorias)**:
  - Extremamente Satisfeito: +5 pontos
  - Excelente: +2 pontos
  - Bom: +1 ponto
  - Regular: 0 pontos
  - Ruim: -10 pontos
  - Péssimo: -10 pontos

**Fórmula de Performance:**
```
Performance = (Pontos Ajustados / Máximo de Pontos Possível) × 100
```

**Margem de Erro (Taxa de Tolerância):**
- 5% dos atendimentos com pontos negativos são neutralizados (convertidos para 0)

#### `elegibilidade.test.ts` 🔑 TESTES

Testa consistência entre server e client:
- Verifica se funções retornam resultados idênticos
- 10+ casos de teste cobertos
- Valida edge cases

#### `seed.ts`
- Script para popular banco com dados de teste
- Cria atendentes, produções, etc
- Usado para desenvolvimento

#### `notificacoes.ts`
- Sistema de notificações
- Alertas para elegibilidade
- Email notifications

#### `pdf-export.ts`
- Gera relatórios em PDF
- Integra com jsPDF
- Exporta dados tabulares

#### `storage.ts`
- Gerenciamento de arquivos em S3 (AWS)
- Upload/download
- URLs pré-assinadas

#### `routers/producao.ts`
- CRUD de produções
- Queries para buscar dados
- Cálculos de elegibilidade por período
- Filtros por mês, ano, turno, atendente

#### `routers/atendentes.ts`
- CRUD de atendentes
- Busca com filtros
- Atualização de status
- Configuração de tolerância personalizada

#### `routers/auth.ts`
- Autenticação e login
- Sessões
- Logout

#### `routers/comissoes.ts`
- Lógica de comissões
- Cálculos agregados
- Filtros por período

---

## 📊 PASTA: `/drizzle`

### Descrição
Migrações e schema do banco de dados (Drizzle ORM)

### Estrutura

```
drizzle/
├── schema.ts                        # Definição das tabelas
├── relations.ts                     # Relacionamentos entre tabelas
├── meta/
│   └── _journal.json               # Log de migrações
├── migrations/                      # Arquivos SQL de migrações
│   └── add_semanas_to_producaomensal.sql
└── [Migrações numeradas]
   ├── 0000_huge_white_tiger.sql
   ├── 0001_thankful_toxin.sql
   └── ... (mais migrações)
```

#### `schema.ts`
Define as tabelas do banco:

**Tabelas Principais:**

1. **Atendentes**
   - id, nome, email, senha
   - turno (A, B, C)
   - status (Ativo, Inativo)
   - toleranciaPersonalizada (%)
   - dataCriacao

2. **Producoes**
   - id, atendenteId, mes, ano
   - chatTotal, ligacaoTotal
   - chatNota5, chatNota4, chatNota3, chatNota2, chatNota1
   - ligacaoExtrementeSatisfeito, ligacaoExcelente, ligacaoBom, ligacaoRegular, ligacaoRuim, ligacaoPessimo
   - pontosTotais, maxPontos, performance
   - elegivel (1/0), bonificacao
   - mediaDoTurno

3. **Usuarios**
   - Dados de autenticação
   - Relacionado com Atendentes

4. **ProducaoMensal**
   - Agregação de produções por mês
   - Performance consolidada

#### `relations.ts`
Define os relacionamentos:
- Atendentes ↔ Produções (1:N)
- Atendentes ↔ Usuários (1:1)

---

## 🛠️ PASTA: `/scripts`

### Descrição
Scripts utilitários para desenvolvimento e manutenção

### Arquivos

#### `show_elegibilidade.ts`
- **Função**: CLI para visualizar elegibilidade de atendentes
- **Uso**: `tsx scripts/show_elegibilidade.ts`
- **Mostra**:
  - Performance de cada atendente
  - Média do turno
  - Elegibilidade calculada
  - Motivo da inelegibilidade

#### `test-create-producao.ts`
- Script para testar criação de produções
- Valida cálculos

#### `check-alexandre-feb2026.ts`
- Script específico para auditoria
- Verifica dados de Alexandre em fevereiro 2026

#### `copy-shared-assets.js`
- Copia assets para diretório público
- Build helper

---

## 🔧 PASTA: `/patches`

### Descrição
Patches para dependências com problemas

### Arquivos

#### `wouter@3.7.1.patch`
- Patch para a biblioteca `wouter` (router)
- Corrige comportamentos específicos

---

## ⚙️ ARQUIVOS DE CONFIGURAÇÃO (Raiz)

### `package.json`
- Dependências do projeto
- Scripts npm:
  - `dev`: Inicia servidor em modo desenvolvimento
  - `build`: Compila para produção
  - `start`: Inicia servidor em produção
  - `test`: Executa testes
  - `db:push`: Aplica migrações
  - `db:seed`: Popula banco com dados de teste

### `tsconfig.json`
- Configuração do TypeScript
- Paths alias (@/, etc)
- Rigor do compilador

### `vite.config.ts`
- Configuração do Vite (bundler frontend)
- Setup de plugins React
- Otimizações de build

### `vitest.config.ts`
- Configuração do Vitest (test runner)
- Coverage setup
- Environment configuration

### `drizzle.config.ts`
- Configuração do Drizzle ORM
- Caminho do schema
- Configuração do driver MySQL

### `components.json`
- Configuração do CLI Shadcn/ui
- Aliases para componentes

---

## 📝 ARQUIVOS DE DOCUMENTAÇÃO

### Guias Técnicos (Criados na migração)
- `GUIA_SETUP_LOCAL.md` - Como configurar ambiente
- `GUIA_DEPLOY_BANCO_DADOS.md` - Deploy do banco
- `GUIA_DEPLOY_VERCEL.md` - Deploy em Vercel
- `GUIA_ESTRUTURA_PROJETO.md` - Este arquivo
- `GUIA_TROUBLESHOOTING.md` - Solução de problemas

### Documentação de Lógica
- `TOLERANCIA_IMPLEMENTATION.md` - Sistema de tolerância
- `SISTEMA_TOLERANCIA_PERSONALIZADA.md` - Tolerância por atendente
- `TOLERANCIA_ZERO_DEFAULT.md` - Padrão de zero tolerância

### Análises
- `ANALISE_DISCREPANCIAS_COMISSOES.md` - Análise de divergências
- `CHANGELOG_PERFORMANCE_MODEL.md` - Histórico de mudanças

### Referências
- `README.md` - Overview geral
- `VM_FLIP.md` - Informações sobre VM
- `todo.md` - Tasks pendentes

---

## 🔑 FLUXO DE DADOS - ELEGIBILIDADE

### 1. **Entrada de Dados**
```
Atendente realiza chat/ligação
     ↓
Sistema registra (Chat Nota 5-1, Ligação Satisfação 6 níveis)
     ↓
Dados salvos em Producoes tabela
```

### 2. **Cálculo de Performance (Servidor)**
```
No servidor (bonificacao.ts::calcularProducao):
  1. Soma pontos por chat e ligação
  2. Calcula máximo de pontos possível
  3. Aplica margem de erro (neutraliza 5% de erros)
  4. Performance = (Pontos Ajustados / Máx) × 100
```

### 3. **Cálculo de Média do Turno (Servidor)**
```
No servidor (bonificacao.ts::calcularMediaTurno):
  1. Pega todas as produções do turno
  2. Calcula performance de cada uma
  3. Retorna MÉDIA DE PERFORMANCES (não de atendimentos!)
```

### 4. **Verificação de Elegibilidade (Servidor + Cliente)**
```
No servidor (bonificacao.ts::verificarElegibilidade):
  1. Se performance < 80%  → Inelegível ❌
  2. Se performance <= mediaDoTurno → Inelegível ❌
  3. Se performance >= 80% AND > mediaDoTurno → Elegível ✅

No cliente (client/src/lib/elegibilidade.ts):
  Mesma lógica (sincronizado com servidor)
```

### 5. **Exibição em Páginas**
```
Performance.tsx:
  - Mostra performance e elegibilidade individual
  - Recalcula em tempo real

Comissoes.tsx:
  - Lista atendentes com elegibilidade
  - Mostra bonificação (100%=R$500, 96%=R$400, etc)
  - Recalcula para cada atendente

Dashboard.tsx:
  - Pie chart: Elegíveis vs Inelegíveis
  - Usa useMemo para recalcular dinamicamente

VisaoTurno.tsx:
  - Agrupa por turno (A, B, C)
  - Mostra média do turno
  - Elegibilidade de cada atendente
```

---

## 🧪 TESTES

### `server/elegibilidade.test.ts`
```
✓ Performance < 80% → Inelegível
✓ Performance = Média → Inelegível
✓ Performance < Média → Inelegível
✓ Performance >= 80% AND > Média → Elegível
✓ Performance = 100% → Elegível
✓ Média = 0 → Funciona corretamente
✓ Casos extremos funcionam
```

### Rodando Testes
```bash
npx vitest run server/elegibilidade.test.ts
```

---

## 📦 TECNOLOGIAS

### Frontend
- **React 18** - UI library
- **TypeScript** - Tipagem estática
- **Vite** - Build tool rápido
- **Tailwind CSS** - Estilo
- **Radix UI** - Componentes acessíveis
- **Recharts** - Gráficos
- **tRPC Client** - Type-safe API calls
- **React Query** - Cache de dados

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **tRPC** - Type-safe RPC
- **Drizzle ORM** - Database ORM
- **MySQL** - Database
- **Zod** - Validação de dados
- **AWS S3** - Storage de arquivos
- **jsPDF** - Exportação PDF

### Development
- **TypeScript** - Linguagem
- **Vitest** - Test runner
- **ESLint** - Linting
- **Prettier** - Formatação
- **tsx** - Executar TypeScript no Node

---

## 📞 Contato e Suporte

Para dúvidas sobre a estrutura:
1. Verifique `GUIA_TROUBLESHOOTING.md`
2. Consulte a documentação específica do módulo
3. Veja os testes em `elegibilidade.test.ts`

---

**Última Atualização**: Março 4, 2026  
**Versão**: 1.0 - Completa  
**Status**: ✅ Pronto para Produção
