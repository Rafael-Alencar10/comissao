# 🚀 Guia Completo: Deploy na Vercel - Flip Performance

Este guia mostra como fazer deploy do Flip Performance na Vercel de forma simples e rápida.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Passo 1: Preparar o Projeto](#passo-1-preparar-o-projeto)
3. [Passo 2: Conectar com GitHub](#passo-2-conectar-com-github)
4. [Passo 3: Configurar Banco de Dados](#passo-3-configurar-banco-de-dados)
5. [Passo 4: Fazer Deploy](#passo-4-fazer-deploy)
6. [Passo 5: Testar](#passo-5-testar)
7. [Solução de Problemas](#solução-de-problemas)

---

## Pré-requisitos

Antes de começar, você precisa ter:

- ✅ Projeto Flip Performance funcionando localmente
- ✅ Conta no GitHub
- ✅ Conta no PlanetScale (ou outro banco)
- ✅ Conta na Vercel (gratuita)

---

## Passo 1: Preparar o Projeto

### 1.1 Verificar se tudo está funcionando localmente

```bash
npm run dev
```

Acesse `http://localhost:3000` e verifique se funciona.

### 1.2 Criar arquivo `.env.production`

Na raiz do projeto, crie um arquivo chamado `.env.production`:

```
DATABASE_URL="mysql://seu_usuario:sua_senha@seu_host/flip_performance?ssl={"rejectUnauthorized":true}"
JWT_SECRET="sua_chave_secreta_muito_segura"
VITE_APP_ID="seu_app_id"
OAUTH_SERVER_URL="https://seu-projeto.vercel.app"
VITE_OAUTH_PORTAL_URL="https://seu-projeto.vercel.app"
OWNER_NAME="Seu Nome"
OWNER_OPEN_ID="seu_open_id"
BUILT_IN_FORGE_API_URL="https://seu-projeto.vercel.app"
BUILT_IN_FORGE_API_KEY="sua_chave"
VITE_FRONTEND_FORGE_API_URL="https://seu-projeto.vercel.app"
VITE_FRONTEND_FORGE_API_KEY="sua_chave"
VITE_ANALYTICS_ENDPOINT="https://seu-projeto.vercel.app"
VITE_ANALYTICS_WEBSITE_ID="seu_id"
VITE_APP_TITLE="Flip Performance"
VITE_APP_LOGO="/flip-logo.png"
```

### 1.3 Adicionar ao `.gitignore`

Abra o arquivo `.gitignore` e adicione:

```
.env
.env.production
.env.local
```

Isso garante que suas senhas não sejam enviadas para GitHub.

### 1.4 Fazer commit e push

```bash
git add .
git commit -m "Preparar para deploy na Vercel"
git push origin main
```

---

## Passo 2: Conectar com GitHub

### 2.1 Criar repositório no GitHub (se ainda não tiver)

1. Acesse [github.com](https://github.com/)
2. Clique em **"New"** (novo repositório)
3. Nome: `flip-performance`
4. Descrição: `Sistema de Gestão de Bonificação`
5. Escolha **"Public"** ou **"Private"**
6. Clique em **"Create repository"**

### 2.2 Conectar seu projeto local com GitHub

Se ainda não fez:

```bash
git remote add origin https://github.com/seu-usuario/flip-performance.git
git branch -M main
git push -u origin main
```

Se já fez, apenas verifique:

```bash
git remote -v
```

Você deve ver algo como:
```
origin  https://github.com/seu-usuario/flip-performance.git (fetch)
origin  https://github.com/seu-usuario/flip-performance.git (push)
```

---

## Passo 3: Configurar Banco de Dados

### 3.1 Criar Banco no PlanetScale

1. Acesse [planetscale.com](https://planetscale.com/)
2. Clique em **"Create a new database"**
3. Nome: `flip-performance`
4. Região: Escolha a mais próxima
5. Clique em **"Create database"**

### 3.2 Obter String de Conexão

1. No banco criado, clique em **"Connect"**
2. Escolha **"Node.js"**
3. Copie a string (parece com: `mysql://...`)
4. Guarde para o próximo passo

---

## Passo 4: Fazer Deploy

### 4.1 Criar Conta na Vercel

1. Acesse [vercel.com](https://vercel.com/)
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"**
4. Autorize o acesso

### 4.2 Importar Projeto

1. No dashboard da Vercel, clique em **"Add New"** → **"Project"**
2. Clique em **"Import Git Repository"**
3. Procure por `flip-performance`
4. Clique em **"Import"**

### 4.3 Configurar Variáveis de Ambiente

1. Na tela de configuração, vá para **"Environment Variables"**
2. Adicione as seguintes variáveis:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | Cole a string do PlanetScale |
| `JWT_SECRET` | Uma chave secreta (ex: `seu_jwt_secret_123456`) |
| `VITE_APP_ID` | `seu_app_id` |
| `OAUTH_SERVER_URL` | `https://seu-projeto.vercel.app` |
| `VITE_OAUTH_PORTAL_URL` | `https://seu-projeto.vercel.app` |
| `OWNER_NAME` | Seu nome |
| `OWNER_OPEN_ID` | `seu_open_id` |
| `BUILT_IN_FORGE_API_URL` | `https://seu-projeto.vercel.app` |
| `BUILT_IN_FORGE_API_KEY` | `sua_chave` |
| `VITE_FRONTEND_FORGE_API_URL` | `https://seu-projeto.vercel.app` |
| `VITE_FRONTEND_FORGE_API_KEY` | `sua_chave` |
| `VITE_ANALYTICS_ENDPOINT` | `https://seu-projeto.vercel.app` |
| `VITE_ANALYTICS_WEBSITE_ID` | `seu_id` |
| `VITE_APP_TITLE` | `Flip Performance` |
| `VITE_APP_LOGO` | `/flip-logo.png` |

3. Clique em **"Deploy"**

### 4.4 Aguardar Deploy

A Vercel começará a compilar seu projeto. Isso pode levar 3-5 minutos. Você verá uma barra de progresso.

Quando terminar, você verá uma mensagem de sucesso com um link como:
```
https://flip-performance-seu-usuario.vercel.app
```

---

## Passo 5: Testar

### 5.1 Acessar o Site

1. Clique no link fornecido pela Vercel
2. Você deve ver a página de login do Flip Performance
3. Faça login com suas credenciais

### 5.2 Testar Funcionalidades

1. Acesse o Dashboard
2. Navegue por todas as páginas
3. Teste criar um novo atendente
4. Teste lançar produção
5. Verifique se os dados são salvos

### 5.3 Verificar Logs

Se algo der errado:

1. No dashboard da Vercel, clique em **"Deployments"**
2. Clique no deployment mais recente
3. Vá para **"Logs"** para ver mensagens de erro

---

## 🔄 Fazer Atualizações

Depois que está em produção, qualquer mudança é fácil:

### 1. Fazer Mudanças Localmente

```bash
# Edite os arquivos
# Teste localmente
npm run dev
```

### 2. Fazer Commit e Push

```bash
git add .
git commit -m "Descrição da mudança"
git push origin main
```

### 3. Vercel Faz Deploy Automaticamente

Vercel detecta o push e faz deploy automaticamente. Você verá o progresso no dashboard.

---

## 🚨 Solução de Problemas

### Erro: "Build failed"

**Causa:** Erro na compilação

**Solução:**
1. Verifique os logs da Vercel
2. Procure por erros de TypeScript
3. Corrija localmente e faça push novamente

### Erro: "Cannot connect to database"

**Causa:** `DATABASE_URL` incorreta ou banco não acessível

**Solução:**
1. Verifique a string no PlanetScale
2. Certifique-se de que é a string de produção
3. Atualize em Vercel → Settings → Environment Variables

### Site carrega mas está vazio

**Causa:** Migrations não foram executadas

**Solução:**
1. Conecte ao PlanetScale
2. Verifique se as tabelas existem
3. Se não, execute:
```bash
npm run db:push
```

### Erro 500 ao acessar

**Causa:** Erro no servidor

**Solução:**
1. Verifique os logs da Vercel
2. Procure por mensagens de erro
3. Corrija o código e faça push

### Banco de dados está vazio

**Causa:** Dados não foram sincronizados

**Solução:**
1. Verifique se as migrations rodaram
2. Faça seed dos dados:
```bash
npm run db:seed
```

---

## 📊 Monitorar Produção

### Verificar Status

1. No dashboard da Vercel, você vê o status de cada deployment
2. Verde = sucesso
3. Amarelo = em progresso
4. Vermelho = erro

### Ver Logs

1. Clique em um deployment
2. Vá para **"Logs"** para ver o que aconteceu
3. Procure por erros ou avisos

### Configurar Alertas

1. Settings → **"Notifications"**
2. Configure para receber alertas de falhas

---

## 🎯 Checklist Final

- [ ] Projeto funciona localmente
- [ ] Repositório GitHub criado
- [ ] Banco PlanetScale criado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy feito na Vercel
- [ ] Site acessível
- [ ] Funcionalidades testadas
- [ ] Dados sendo salvos

---

## 🔐 Segurança

### Boas Práticas

1. **Nunca compartilhe `DATABASE_URL`** - É uma senha
2. **Use variáveis de ambiente** - Não hardcode senhas
3. **Ative SSL** - PlanetScale já faz isso
4. **Backup regular** - Configure no PlanetScale
5. **Monitore acessos** - Veja logs regularmente

---

## 📈 Próximos Passos

1. **Configurar domínio customizado** - Em vez de `vercel.app`
2. **Configurar CI/CD** - Testes automáticos antes de deploy
3. **Monitorar performance** - Use ferramentas de analytics
4. **Escalar** - Se crescer muito, considere plano pago

---

## 🔗 Links Úteis

- [Vercel Docs](https://vercel.com/docs)
- [PlanetScale Docs](https://planetscale.com/docs)
- [GitHub Docs](https://docs.github.com/)

---

**Versão:** 1.0  
**Última atualização:** Fevereiro de 2026  
**Autor:** Manus AI
