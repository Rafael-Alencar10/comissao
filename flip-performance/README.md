# flip-performance

Projeto monorepo que contém frontend e backend para monitoramento e ferramentas de performance.

**Resumo**

- **Descrição**: Aplicação fullstack (cliente + servidor) com migrações Drizzle, scripts de utilitários e testes com Vitest.
- **Licença**: MIT (ver `package.json`).

**Estrutura do Repositório**

- `client/`: aplicativo React + Vite (frontend).
- `server/`: código do backend (Express/TrPC, endpoints, geração de PDF, etc.).
- `drizzle/`: migrations e schema para o banco de dados.
- `shared/`: tipos e constantes compartilhadas entre cliente e servidor.
- `scripts/`: scripts utilitários usados no desenvolvimento.

**Pré-requisitos**

- Node.js (versão LTS recomendada).
- `pnpm` é o gerenciador recomendado (veja `package.json`), mas `npm` também funciona.
- Banco de dados configurado (o projeto usa `mysql2` como dependência; ajuste as variáveis de ambiente conforme necessário).

**Instalação (local)**

1. Instale dependências:

   - Com `pnpm` (recomendado):

     `pnpm install`

   - Ou com `npm`:

     `npm install`

2. Crie um arquivo `.env` com as variáveis necessárias (ex.: `DATABASE_URL`, `NODE_ENV`, chaves de AWS, etc.).
3. Execute migrações e seed (se aplicável):

   - `pnpm run db:push`  (ou `npm run db:push`)
   - `pnpm run db:seed`  (ou `npm run db:seed`)

4. Rode a aplicação em modo desenvolvimento:

   - `pnpm run dev`  (ou `npm run dev`)

**Scripts úteis** (ver `package.json`)

- `dev`: inicia o ambiente de desenvolvimento (watch + servidor com `tsx`).
- `build`: gera o bundle do cliente e empacota o servidor com `esbuild`.
- `start`: inicia a build de produção (`node dist/index.js`).
- `test`: executa testes com `vitest`.
- `check`: checa tipos com `tsc --noEmit`.
- `format`: formata o código com `prettier`.
- `db:push`: gera e aplica migrações com `drizzle-kit`.
- `db:seed`: executa o `server/seed.ts` para popular dados de desenvolvimento.

**Executando localmente (resumo rápido)**

1. `pnpm install`
2. Configurar `.env`
3. `pnpm run db:push && pnpm run db:seed` (opcional)
4. `pnpm run dev`

Depois, abra o frontend (normalmente servido pelo Vite) e o backend conforme as saídas do comando `dev`.

**Testes**

- Executar testes: `pnpm run test` ou `npm run test`.

**Contribuição**

- Abra issues para bugs ou melhorias.
- Para PRs: crie uma branch a partir de `main`, siga o padrão de lint/format (`pnpm run format`) e adicione testes quando relevante.

**Observações e documentos úteis**

- Há arquivos relacionados à tolerância do sistema: `TOLERANCIA_IMPLEMENTATION.md`, `TOLERANCIA_ZERO_DEFAULT.md`, e scripts de teste `test-tolerance.ts`.
- Migrações e snapshots estão em `drizzle/`.

**Licença**

Este projeto está licenciado sob a licença MIT. Veja `package.json` para referência.
# Flip Performance

## Build e Deploy

### 1. Cópia de Assets Compartilhados

Antes de rodar o backend em produção, execute o script para copiar os assets compartilhados:

```sh
npm run copy-shared-assets
```

Esse comando copia arquivos de `shared/assets/` para `server/public/`, garantindo que imagens e outros arquivos estejam disponíveis para o backend.

### 2. Variável de Ambiente para Logo do PDF

Você pode definir o caminho da logo usada no PDF exportado via variável de ambiente:

```
LOGO_PATH="/caminho/absoluto/para/flip-pdf.png"
```

Se não definido, o backend usará o caminho padrão: `server/public/flip-pdf.png`.

### 3. Build e Start

Para buildar e rodar em produção:

```sh
npm run build
npm run copy-shared-assets
npm start
```

---

Consulte também os guias `GUIA_SETUP_LOCAL.md` e `GUIA_DEPLOY_VERCEL.md` para instruções detalhadas de ambiente e deploy.
