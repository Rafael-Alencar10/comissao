# ⚡ Guia de Comandos Rápidos - Flip Performance

Este é um guia de referência rápida com os comandos mais usados.

---

## 🚀 Comandos Principais

### Iniciar o Projeto

```bash
npm run dev
```

Acesse: `http://localhost:3000`

### Parar o Projeto

Pressione `Ctrl + C` no Terminal

### Instalar Dependências

```bash
npm install
```

### Atualizar Dependências

```bash
npm update
```

---

## 🗄️ Banco de Dados

### Executar Migrations

```bash
npm run db:push
```

### Resetar o Banco

```bash
# Conecte ao MySQL
mysql -u root -p

# Digite sua senha, depois:
DROP DATABASE flip_performance;
CREATE DATABASE flip_performance;
EXIT;

# Execute as migrations
npm run db:push
```

### Acessar o MySQL

```bash
mysql -u root -p
```

### Ver Tabelas

```sql
USE flip_performance;
SHOW TABLES;
```

### Ver Dados de uma Tabela

```sql
SELECT * FROM atendentes;
SELECT * FROM producao;
SELECT * FROM comissoes;
```

### Fazer Backup

```bash
mysqldump -u root -p flip_performance > backup.sql
```

### Restaurar Backup

```bash
mysql -u root -p flip_performance < backup.sql
```

---

## 🧪 Testes

### Rodar Todos os Testes

```bash
npm test
```

### Rodar Testes em Modo Watch

```bash
npm test -- --watch
```

### Rodar um Teste Específico

```bash
npm test -- arquivo.test.ts
```

---

## 🔨 Build e Compilação

### Compilar para Produção

```bash
npm run build
```

### Visualizar Build

```bash
npm run preview
```

---

## 🧹 Limpeza

### Limpar Cache do npm

```bash
npm cache clean --force
```

### Remover node_modules

```bash
# macOS/Linux
rm -rf node_modules

# Windows
rmdir /s node_modules
```

### Remover package-lock.json

```bash
# macOS/Linux
rm package-lock.json

# Windows
del package-lock.json
```

### Limpar Tudo e Reinstalar

```bash
rm -rf node_modules package-lock.json  # macOS/Linux
npm install
```

---

## 🔍 Verificação

### Verificar Versão do Node

```bash
node --version
```

### Verificar Versão do npm

```bash
npm --version
```

### Verificar Versão do Git

```bash
git --version
```

### Verificar Versão do MySQL

```bash
mysql --version
```

### Listar Processos Rodando

```bash
# macOS/Linux
ps aux | grep node

# Windows
tasklist | findstr node
```

---

## 🌐 Portas Comuns

| Serviço | Porta | URL |
|---------|-------|-----|
| Projeto | 3000 | http://localhost:3000 |
| MySQL | 3306 | localhost:3306 |
| Alternativa | 3001 | http://localhost:3001 |

---

## 📝 Variáveis de Ambiente

### Ver Arquivo .env

```bash
# macOS/Linux
cat .env

# Windows
type .env
```

### Editar Arquivo .env

```bash
# Abra com seu editor favorito
code .env
```

---

## 🐛 Debug

### Ver Logs do Servidor

Os logs aparecem no Terminal quando você executa `npm run dev`

### Ativar Modo Debug

```bash
DEBUG=* npm run dev
```

### Inspecionar com DevTools

1. Abra `http://localhost:3000` no navegador
2. Pressione `F12` para abrir DevTools
3. Vá para a aba "Console" para ver erros

---

## 📦 Gerenciamento de Dependências

### Instalar Nova Dependência

```bash
npm install nome-do-pacote
```

### Instalar Dependência de Desenvolvimento

```bash
npm install --save-dev nome-do-pacote
```

### Remover Dependência

```bash
npm uninstall nome-do-pacote
```

### Listar Dependências Instaladas

```bash
npm list
```

---

## 🔄 Git

### Ver Status

```bash
git status
```

### Adicionar Arquivo

```bash
git add .
```

### Fazer Commit

```bash
git commit -m "Mensagem do commit"
```

### Fazer Push

```bash
git push origin main
```

### Fazer Pull

```bash
git pull origin main
```

### Ver Histórico

```bash
git log
```

---

## 🆘 Emergência

### Matar Processo na Porta 3000

```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Resetar Tudo

```bash
# Remova tudo
rm -rf node_modules package-lock.json .env

# Recrie o .env (veja GUIA_SETUP_LOCAL.md)

# Reinstale
npm install

# Execute migrations
npm run db:push

# Inicie
npm run dev
```

### Ver Espaço em Disco

```bash
# macOS/Linux
df -h

# Windows
wmic logicaldisk get name,size,freespace
```

---

## 📚 Referência Rápida de Atalhos

| Atalho | O que faz |
|--------|-----------|
| `Ctrl + C` | Para o servidor |
| `Ctrl + L` | Limpa o Terminal |
| `Ctrl + A` | Seleciona tudo |
| `Ctrl + V` | Cola |
| `Ctrl + Z` | Desfaz (no editor) |
| `Ctrl + S` | Salva (no editor) |
| `Ctrl + Shift + Delete` | Limpa cache do navegador |
| `F12` | Abre DevTools do navegador |

---

## 💡 Dicas

1. **Use setas para cima/baixo** no Terminal para repetir comandos anteriores
2. **Pressione Tab** para autocompletar nomes de arquivos
3. **Use `--help`** em qualquer comando para ver opções: `npm --help`
4. **Salve este arquivo** como referência rápida
5. **Crie aliases** para comandos que usa frequentemente

---

## 🔗 Referências

- [Documentação npm](https://docs.npmjs.com/)
- [Documentação Node.js](https://nodejs.org/docs/)
- [Documentação MySQL](https://dev.mysql.com/doc/)
- [Documentação Git](https://git-scm.com/doc)

---

**Versão:** 1.0  
**Última atualização:** Fevereiro de 2026  
**Autor:** Manus AI
