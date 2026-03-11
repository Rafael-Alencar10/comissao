# 📁 Guia da Estrutura do Projeto - Flip Performance

Este documento explica a organização de pastas e arquivos do projeto Flip Performance, ajudando você a entender onde cada coisa fica.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Arquivos Importantes](#arquivos-importantes)
4. [Como Adicionar Novas Funcionalidades](#como-adicionar-novas-funcionalidades)

---

## Visão Geral

O Flip Performance é dividido em duas partes principais:

- **Frontend:** Interface do usuário (o que você vê no navegador)
- **Backend:** Servidor e banco de dados (o que funciona nos bastidores)

```
flip-performance/
├── client/          ← Frontend (React)
├── server/          ← Backend (Node.js)
├── drizzle/         ← Banco de dados
├── package.json     ← Configurações do projeto
└── .env             ← Variáveis de ambiente
```

---

## Estrutura de Pastas

### 📁 Pasta `client/` - Frontend

Esta pasta contém toda a interface do usuário.

```
client/
├── src/
│   ├── pages/           ← Páginas do aplicativo
│   │   ├── Dashboard.tsx
│   │   ├── Atendentes.tsx
│   │   ├── VisaoTurno.tsx
│   │   ├── Lancamento.tsx
│   │   ├── Historico.tsx
│   │   ├── Comissoes.tsx
│   │   ├── Performance.tsx
│   │   └── Home.tsx
│   │
│   ├── components/      ← Componentes reutilizáveis
│   │   ├── DashboardLayout.tsx    ← Layout principal
│   │   ├── ui/                    ← Componentes de UI
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   └── ExportPDFButton.tsx
│   │
│   ├── lib/
│   │   └── trpc.ts      ← Configuração do tRPC
│   │
│   ├── contexts/        ← Contextos React
│   ├── hooks/           ← Hooks customizados
│   ├── App.tsx          ← Arquivo principal
│   ├── main.tsx         ← Ponto de entrada
│   └── index.css        ← Estilos globais
│
├── public/              ← Arquivos estáticos
│   └── flip-logo.png
│
└── index.html           ← HTML principal
```

#### O que cada pasta faz:

- **`pages/`**: Cada arquivo é uma página diferente do aplicativo. Quando você clica em um menu, uma página é carregada.
- **`components/`**: Componentes reutilizáveis como botões, cards, etc.
- **`lib/`**: Bibliotecas e configurações (como tRPC para comunicação com o servidor)
- **`public/`**: Imagens, ícones e outros arquivos que não mudam

---

### 📁 Pasta `server/` - Backend

Esta pasta contém a lógica do servidor.

```
server/
├── routers.ts           ← Define as operações disponíveis
├── db.ts                ← Funções para acessar o banco
├── auth.logout.test.ts  ← Testes
├── _core/               ← Configurações internas
│   ├── index.ts
│   ├── context.ts
│   ├── env.ts
│   ├── oauth.ts
│   ├── llm.ts
│   ├── notification.ts
│   ├── voiceTranscription.ts
│   └── imageGeneration.ts
│
└── storage.ts           ← Funções para armazenar arquivos
```

#### O que cada arquivo faz:

- **`routers.ts`**: Define as "rotas" (operações) que o frontend pode chamar. Por exemplo: "buscar atendentes", "criar produção", etc.
- **`db.ts`**: Funções que consultam o banco de dados. Por exemplo: "buscar todos os atendentes", "atualizar comissão".
- **`_core/`**: Configurações internas do servidor (autenticação, OAuth, etc.)

---

### 📁 Pasta `drizzle/` - Banco de Dados

Esta pasta contém a definição do banco de dados.

```
drizzle/
├── schema.ts            ← Define as tabelas do banco
├── migrations/          ← Histórico de mudanças
│   ├── 0000_*.sql
│   ├── 0001_*.sql
│   └── ...
└── meta/                ← Metadados
```

#### O que cada arquivo faz:

- **`schema.ts`**: Define como as tabelas são estruturadas (quais colunas, tipos de dados, etc.)
- **`migrations/`**: Histórico de todas as mudanças feitas no banco
- **`meta/`**: Informações sobre o estado atual do banco

---

## Arquivos Importantes

### 📄 `package.json`

Define as dependências do projeto e scripts para rodar.

```json
{
  "name": "flip-performance",
  "version": "1.0.0",
  "scripts": {
    "dev": "npm run dev",           // Rodar em desenvolvimento
    "build": "npm run build",       // Compilar para produção
    "db:push": "drizzle-kit push",  // Executar migrations
    "test": "vitest"                // Rodar testes
  },
  "dependencies": {
    "react": "^18.0.0",
    "express": "^4.0.0",
    // ... outras dependências
  }
}
```

### 📄 `.env`

Configurações sensíveis (senhas, chaves, etc.)

```
DATABASE_URL="mysql://root:root@localhost:3306/flip_performance"
JWT_SECRET="sua_chave_secreta"
VITE_APP_TITLE="Flip Performance"
```

### 📄 `vite.config.ts`

Configuração do Vite (ferramenta que compila o projeto)

### 📄 `tsconfig.json`

Configuração do TypeScript (linguagem que usamos)

---

## Como Adicionar Novas Funcionalidades

### 1️⃣ Adicionar uma Nova Página

**Passo 1:** Crie um arquivo em `client/src/pages/`

```typescript
// client/src/pages/MinhaNovaPage.tsx
import { useState } from "react";

export default function MinhaNovaPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Minha Nova Página</h1>
      {/* Conteúdo aqui */}
    </div>
  );
}
```

**Passo 2:** Registre a página em `client/src/App.tsx`

```typescript
import MinhaNovaPage from "@/pages/MinhaNovaPage";

// Adicione a rota:
<Route path="/minha-nova-page" element={<MinhaNovaPage />} />
```

**Passo 3:** Adicione um menu em `client/src/components/DashboardLayout.tsx`

```typescript
{ label: "Minha Página", icon: <Icon />, href: "/minha-nova-page" }
```

---

### 2️⃣ Adicionar uma Nova Tabela no Banco

**Passo 1:** Edite `drizzle/schema.ts`

```typescript
export const minhaTabela = sqliteTable('minha_tabela', {
  id: integer('id').primaryKey(),
  nome: text('nome').notNull(),
  criado_em: integer('criado_em').notNull(),
});
```

**Passo 2:** Execute as migrations

```bash
npm run db:push
```

---

### 3️⃣ Adicionar uma Nova Operação no Backend

**Passo 1:** Crie uma função em `server/db.ts`

```typescript
export async function buscarMinhaTabela() {
  return db.select().from(minhaTabela);
}
```

**Passo 2:** Crie uma rota em `server/routers.ts`

```typescript
export const appRouter = router({
  minhaTabela: {
    buscar: publicProcedure.query(async () => {
      return buscarMinhaTabela();
    }),
  },
});
```

**Passo 3:** Use no frontend

```typescript
const { data } = trpc.minhaTabela.buscar.useQuery();
```

---

### 4️⃣ Adicionar um Componente Reutilizável

**Passo 1:** Crie em `client/src/components/`

```typescript
// client/src/components/MeuComponente.tsx
interface Props {
  titulo: string;
  conteudo: string;
}

export function MeuComponente({ titulo, conteudo }: Props) {
  return (
    <div>
      <h2>{titulo}</h2>
      <p>{conteudo}</p>
    </div>
  );
}
```

**Passo 2:** Use em qualquer página

```typescript
import { MeuComponente } from "@/components/MeuComponente";

// Dentro de um componente:
<MeuComponente titulo="Olá" conteudo="Mundo" />
```

---

## 🎯 Fluxo de Dados

Entender como os dados fluem é importante:

```
1. Usuário clica em um botão na página
   ↓
2. Página chama uma função do servidor (via tRPC)
   ↓
3. Servidor recebe a requisição em routers.ts
   ↓
4. Servidor chama uma função em db.ts
   ↓
5. db.ts consulta o banco de dados
   ↓
6. Banco retorna os dados
   ↓
7. db.ts retorna para routers.ts
   ↓
8. routers.ts retorna para a página
   ↓
9. Página atualiza a interface com os dados
```

---

## 📚 Convenções de Código

Para manter o código organizado, seguimos algumas convenções:

### Nomes de Arquivos

- **Páginas:** PascalCase (ex: `Dashboard.tsx`)
- **Componentes:** PascalCase (ex: `DashboardLayout.tsx`)
- **Funções:** camelCase (ex: `buscarAtendentes()`)
- **Variáveis:** camelCase (ex: `totalBonificacao`)

### Estrutura de Componentes

```typescript
import { useState } from "react";
import { Card } from "@/components/ui/card";

interface Props {
  titulo: string;
}

export default function MeuComponente({ titulo }: Props) {
  const [estado, setEstado] = useState("");

  return (
    <Card>
      <h1>{titulo}</h1>
      {/* Conteúdo */}
    </Card>
  );
}
```

---

## 🔍 Como Encontrar Coisas

Se você quer encontrar algo no projeto:

| O que você quer | Onde procurar |
|---|---|
| Página de Dashboard | `client/src/pages/Dashboard.tsx` |
| Função para buscar atendentes | `server/db.ts` → `buscarAtendentes()` |
| Tabela de atendentes no banco | `drizzle/schema.ts` → `atendentes` |
| Componente de botão | `client/src/components/ui/button.tsx` |
| Estilos globais | `client/src/index.css` |
| Configuração do banco | `.env` → `DATABASE_URL` |

---

## 💡 Dicas Úteis

1. **Use Ctrl+P no VS Code** para procurar arquivos rapidamente
2. **Use Ctrl+F** para procurar texto dentro de um arquivo
3. **Use Ctrl+Shift+F** para procurar em todo o projeto
4. **Leia os comentários** no código (linhas começando com `//`)
5. **Explore o `node_modules/`** para entender as bibliotecas usadas

---

## 📖 Próximas Leituras

- [Guia de Setup Local](./GUIA_SETUP_LOCAL.md) - Como rodar o projeto
- [Guia de Troubleshooting](./GUIA_TROUBLESHOOTING.md) - Solução de problemas
- [Documentação do React](https://react.dev/)
- [Documentação do Express](https://expressjs.com/)
- [Documentação do tRPC](https://trpc.io/)

---

**Versão:** 1.0  
**Última atualização:** Fevereiro de 2026  
**Autor:** Manus AI
