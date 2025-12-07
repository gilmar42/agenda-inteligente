# 🔍 Análise do Servidor e Backend

## ❌ PROBLEMAS IDENTIFICADOS

### 1. **Entity User tem campo errado**
- **Problema**: Entidade usa `password` mas código usa `passwordHash`
- **Localização**: `backend/src/entities/User.js` linha 21
- **Impacto**: Falha ao salvar usuários no banco

### 2. **adminRouter.js tem imports incorretos**
- **Problema**: Importa User/Appointment como classe quando são EntitySchema
- **Localização**: `backend/src/routes/adminRouter.js` linhas 5-6
- **Impacto**: Erro ao tentar usar as entidades

### 3. **Database connection falha**
- **Problema**: PostgreSQL retorna erro de autenticação
- **Causa**: Usuário `agenda_user` não existe ou senha errada
- **Fallback**: Sistema usa in-memory storage (dados não persistem)
- **Localização**: `.env` ou PostgreSQL não configurado

### 4. **Entidade User sem campo passwordHash**
- **Problema**: Código tenta salvar `passwordHash` mas coluna é `password`
- **Localização**: `backend/src/server.js` linha 155
- **Impacto**: Inconsistência de dados

### 5. **adminRouter usa AppDataSource incorretamente**
- **Problema**: Tenta usar repositórios sem verificar se DB inicializou
- **Impacto**: Erros ao fazer requisições para admin

## ✅ SOLUÇÕES A APLICAR

1. Renomear `password` para `passwordHash` em User.js
2. Corrigir imports em adminRouter.js
3. Verificar e configurar PostgreSQL ou usar SQLite para dev
4. Adicionar tratamento de erro para when DB não está inicializado
5. Sincronizar campos entre código e entidades
