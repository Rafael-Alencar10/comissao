# 🚀 Guia: Banco de Dados Gratuito para Vercel - Flip Performance

Você quer fazer deploy do Flip Performance na Vercel com um banco de dados gratuito. Este guia compara as melhores opções para seu cenário: **poucos usuários testando → MVP → produção real**.

---

## 📊 Comparação Rápida

| Opção | Tipo | Limite Gratuito | Escalabilidade | Custo Inicial | Recomendação |
|-------|------|-----------------|-----------------|---------------|--------------|
| **PlanetScale** | MySQL | 5GB | ⭐⭐⭐⭐⭐ | Gratuito | ✅ **Melhor para você** |
| **Turso** | SQLite | 9GB | ⭐⭐⭐ | Gratuito | ⭐ Bom, mas SQLite |
| **Railway** | MySQL | $5/mês | ⭐⭐⭐⭐ | Pago | ✅ Alternativa boa |
| **Supabase** | PostgreSQL | 500MB | ⭐⭐⭐⭐ | Gratuito | ⭐ Diferente do MySQL |
| **Neon** | PostgreSQL | 3GB | ⭐⭐⭐⭐ | Gratuito | ⭐ Diferente do MySQL |

---

## 🏆 Recomendação: PlanetScale

### Por que PlanetScale é a melhor opção para você?

1. **MySQL nativo** - Compatível 100% com seu projeto
2. **5GB gratuito** - Suficiente para MVP e testes
3. **Escalável** - Cresce com seu projeto
4. **Integração fácil** - Funciona direto com Vercel
5. **Sem cartão de crédito** - Realmente gratuito
6. **Suporte a branches** - Ótimo para desenvolvimento

---

## 📋 Passo a Passo: PlanetScale + Vercel

### Passo 1: Criar Conta no PlanetScale

1. Acesse [planetscale.com](https://www.planetscale.com/)
2. Clique em **"Sign up"**
3. Escolha **"Sign up with GitHub"** (mais fácil)
4. Autorize o acesso
5. Complete seu perfil

### Passo 2: Criar Banco de Dados

1. No dashboard do PlanetScale, clique em **"Create a new database"**
2. Nome: `flip-performance`
3. Região: Escolha a mais próxima de você
4. Clique em **"Create database"**
5. Aguarde alguns segundos

### Passo 3: Obter String de Conexão

1. No banco criado, clique em **"Connect"**
2. Escolha **"Node.js"** na dropdown
3. Copie a string de conexão (parece com: `mysql://...`)
4. Guarde em um lugar seguro

### Passo 4: Configurar Variáveis de Ambiente

1. Acesse [vercel.com](https://vercel.com/)
2. Vá para seu projeto
3. Clique em **"Settings"** → **"Environment Variables"**
4. Adicione uma nova variável:
   - **Name:** `DATABASE_URL`
   - **Value:** Cole a string do PlanetScale
5. Clique em **"Save"**

### Passo 5: Deploy na Vercel

1. Faça push do seu código para GitHub:
```bash
git add .
git commit -m "Configurar PlanetScale"
git push origin main
```

2. Vercel detecta automaticamente e faz deploy
3. Aguarde a compilação

### Passo 6: Executar Migrations

1. Acesse o dashboard do seu projeto na Vercel
2. Clique em **"Deployments"**
3. Clique no deployment mais recente
4. Vá para **"Functions"** ou use o terminal:

```bash
# No seu computador, execute:
npm run db:push
```

Isso executará as migrations no banco remoto.

---

## ⚠️ Alternativa 1: Turso (SQLite)

### Prós:
- Muito simples de usar
- 9GB gratuito (maior que PlanetScale)
- Ótimo para prototipagem rápida

### Contras:
- **SQLite não é MySQL** - Você precisaria mudar seu projeto
- Menos escalável para produção real
- Não ideal para múltiplos usuários simultâneos

### Quando usar:
- Se quer algo super simples para começar
- Se não se importa em mudar de banco depois

---

## ⚠️ Alternativa 2: Railway

### Prós:
- Interface muito intuitiva
- Suporta MySQL
- Ótima integração com Vercel

### Contras:
- Não é 100% gratuito ($5/mês mínimo)
- Mas é muito barato para começar

### Quando usar:
- Se quer algo super confiável desde o início
- Se pode gastar $5/mês

---

## ⚠️ Alternativa 3: Supabase

### Prós:
- Muito completo (PostgreSQL + Auth + Storage)
- 500MB gratuito
- Ótima documentação

### Contras:
- **PostgreSQL, não MySQL** - Você precisaria adaptar
- Menos dados que PlanetScale

### Quando usar:
- Se quer um backend completo (não só banco)
- Se está aberto a trocar de banco

---

## 🔧 Configuração Detalhada: PlanetScale

### Criar Arquivo `.env.production`

Na raiz do seu projeto, crie um arquivo `.env.production`:

```
DATABASE_URL="mysql://seu_usuario:sua_senha@seu_host/flip_performance?ssl={"rejectUnauthorized":true}"
JWT_SECRET="sua_chave_secreta_muito_segura_aqui"
VITE_APP_ID="seu_app_id"
OAUTH_SERVER_URL="https://seu-dominio.com"
VITE_OAUTH_PORTAL_URL="https://seu-dominio.com"
OWNER_NAME="Seu Nome"
OWNER_OPEN_ID="seu_open_id"
BUILT_IN_FORGE_API_URL="https://seu-dominio.com"
BUILT_IN_FORGE_API_KEY="sua_chave"
VITE_FRONTEND_FORGE_API_URL="https://seu-dominio.com"
VITE_FRONTEND_FORGE_API_KEY="sua_chave"
VITE_ANALYTICS_ENDPOINT="https://seu-dominio.com"
VITE_ANALYTICS_WEBSITE_ID="seu_id"
VITE_APP_TITLE="Flip Performance"
VITE_APP_LOGO="/flip-logo.png"
```

> **Importante:** Não faça commit deste arquivo! Adicione ao `.gitignore`

### Configurar na Vercel

1. No dashboard do projeto na Vercel
2. **Settings** → **Environment Variables**
3. Adicione cada variável uma por uma
4. Clique em **"Save"**

### Testar Conexão

1. Faça um novo deploy
2. Verifique os logs para erros
3. Acesse seu site em `seu-projeto.vercel.app`

---

## 🚨 Problemas Comuns

### Erro: "Connection timeout"

**Causa:** PlanetScale requer SSL

**Solução:** Adicione ao final da `DATABASE_URL`:
```
?ssl={"rejectUnauthorized":true}
```

### Erro: "Access denied"

**Causa:** Credenciais incorretas

**Solução:**
1. Volte ao PlanetScale
2. Clique em **"Connect"**
3. Copie a string novamente
4. Atualize em Vercel

### Erro: "Database does not exist"

**Causa:** Migrations não foram executadas

**Solução:**
```bash
npm run db:push
```

### Banco está vazio

**Causa:** Dados não foram sincronizados

**Solução:**
1. Verifique se as migrations rodaram
2. Faça seed dos dados:
```bash
npm run db:seed
```

---

## 📈 Plano de Crescimento

### Fase 1: MVP (Gratuito)
- PlanetScale gratuito
- Vercel gratuito
- ~10-50 usuários

### Fase 2: Produção Pequena ($5-20/mês)
- PlanetScale pago (se exceder 5GB)
- Vercel Pro ($20/mês)
- ~50-500 usuários

### Fase 3: Produção Grande ($50+/mês)
- PlanetScale Enterprise
- Vercel Enterprise
- Railway ou similar
- 500+ usuários

---

## 🔐 Segurança

### Boas Práticas

1. **Nunca exponha DATABASE_URL** - Use variáveis de ambiente
2. **Use SSL** - PlanetScale obriga, é seguro
3. **Backup regular** - PlanetScale faz automaticamente
4. **Senhas fortes** - Use gerador de senhas
5. **Limitar acesso** - Configure firewall no PlanetScale

### Configurar Firewall no PlanetScale

1. Vá para **Settings** do seu banco
2. Clique em **"Network access"**
3. Adicione IPs da Vercel (automático se usar integração)

---

## 📚 Próximos Passos

1. **Criar conta no PlanetScale** - 5 minutos
2. **Conectar com Vercel** - 5 minutos
3. **Fazer deploy** - 5 minutos
4. **Testar** - 10 minutos

**Total: ~25 minutos**

---

## 🎯 Resumo Final

| Cenário | Recomendação |
|---------|--------------|
| **Quer começar rápido** | PlanetScale |
| **Quer máximo de dados gratuito** | Turso (mas mude de banco depois) |
| **Quer algo muito confiável** | Railway ($5/mês) |
| **Quer backend completo** | Supabase (PostgreSQL) |

---

## 🔗 Links Úteis

- [PlanetScale](https://planetscale.com/)
- [Vercel](https://vercel.com/)
- [Documentação PlanetScale](https://planetscale.com/docs)
- [Documentação Vercel](https://vercel.com/docs)
- [Drizzle ORM (seu ORM)](https://orm.drizzle.team/)

---

## ❓ Perguntas Frequentes

### P: Preciso de cartão de crédito?
**R:** Não para PlanetScale ou Vercel. Mas pode ser pedido para verificação.

### P: Quanto custa quando sair do gratuito?
**R:** PlanetScale começa em $29/mês. Vercel em $20/mês. Mas você pode usar Railway por $5/mês.

### P: Posso mudar de banco depois?
**R:** Sim, mas é trabalhoso. Escolha bem desde o início.

### P: E se eu quiser usar outro banco?
**R:** Veja as alternativas acima. Supabase (PostgreSQL) é muito bom.

### P: Como faço backup?
**R:** PlanetScale faz automaticamente. Você também pode fazer dump manual.

---

**Versão:** 1.0  
**Última atualização:** Fevereiro de 2026  
**Autor:** Manus AI
