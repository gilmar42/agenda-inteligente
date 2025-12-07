# 🚀 Google OAuth - Configuração em 5 Minutos

## ⏱️ Tempo Estimado: 5 minutos

---

## PASSO 1: Acessar Google Cloud Console (1 minuto)

### Link Direto:
```
https://console.cloud.google.com
```

### O que você verá:
- Topo esquerdo: "Select a Project"
- Vários projetos listados (ou nenhum se for primeira vez)

---

## PASSO 2: Criar Novo Projeto (1 minuto)

### 2.1 Clique em "SELECT A PROJECT" (topo esquerdo)

### 2.2 Clique em "NEW PROJECT"

### 2.3 Preencha:
- **Project name**: `agenda-inteligente`
- **Organization**: Deixe vazio
- **Location**: Deixe padrão

### 2.4 Clique em "CREATE"

### 2.5 Aguarde 1-2 minutos pela criação

---

## PASSO 3: Habilitar Google Identity API (1 minuto)

### 3.1 No menu esquerdo, clique em **"APIs & Services"**

### 3.2 Clique em **"Library"**

### 3.3 Procure por: `Google Identity Services`

### 3.4 Clique no resultado (não é "Identity and Access Management")

### 3.5 Clique em **"ENABLE"**

✅ API habilitada!

---

## PASSO 4: Configurar OAuth Consent Screen (1 minuto)

### 4.1 Volte a **"APIs & Services"** → **"OAuth consent screen"**

### 4.2 Selecione **User Type: "External"** → **CREATE**

### 4.3 Preencha os campos:
```
App name:                   Agenda Inteligente
User support email:         seu-email@gmail.com
Developer contact (same):   seu-email@gmail.com
```

### 4.4 Clique em **"SAVE AND CONTINUE"**

### 4.5 **Scopes**: Deixar em branco → **"SAVE AND CONTINUE"**

### 4.6 **Test users**: Adicionar seu email
- Clique em **"+ ADD USERS"**
- Cole seu email
- Clique em **"ADD"**

### 4.7 Clique em **"SAVE AND CONTINUE"**

### 4.8 Clique em **"BACK TO DASHBOARD"**

✅ OAuth consent screen configurada!

---

## PASSO 5: Criar OAuth Client ID (1 minuto)

### 5.1 Volte a **"APIs & Services"** → **"Credentials"**

### 5.2 Clique em **"+ CREATE CREDENTIALS"**

### 5.3 Selecione **"OAuth client ID"**

### 5.4 Escolha **Application type: "Web application"**

### 5.5 Em **"Authorized JavaScript origins"**, adicione:
```
http://localhost:3001
http://localhost:5173
http://localhost:5176
http://localhost:5000
```

**Modo rápido**: Copie e cole um por um pressionando Enter após cada um

### 5.6 Em **"Authorized redirect URIs"**, adicione:
```
http://localhost:3001
http://localhost:3001/auth/google
http://localhost:5173
http://localhost:5176
http://localhost:5000
```

### 5.7 Clique em **"CREATE"**

### 5.8 Copie o **Client ID** que aparecer

```
Formato esperado: 123456789-abcdefghijklmnop.apps.googleusercontent.com
```

---

## PASSO 6: Salvar Client ID nos .env Files (1 minuto)

### 6.1 Frontend
```bash
# Abra: frontend/.env

VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

### 6.2 Backend
```bash
# Abra: backend/.env

GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

⚠️ **IMPORTANTE**: Use o MESMO Client ID em ambos!

---

## PASSO 7: Reiniciar Serviços

```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev -- --host
```

---

## ✅ TESTAR!

### Teste 1: Frontend
1. Acesse: **http://localhost:5176/signup**
2. Clique em **"Sign up with Google"**
3. Popup abre → Faça login com sua conta Google
4. Deve redirecionar para **/admin**

### Teste 2: Login
1. Acesse: **http://localhost:5176/login**
2. Clique em **"Sign in with Google"**
3. Deve entrar com a conta Google anterior

### Teste 3: Email + Senha
1. Em **/signup**: Preencha nome, email, telefone, senha
2. Clique em **"Cadastrar"**
3. Deve redirecionar para **/admin**

---

## 🆘 Se Algo Não Funcionar

### Popup Google não abre?
1. Verificar se Client ID está correto em `frontend/.env`
2. Verificar se frontend está rodando
3. Abrir DevTools (F12) → Console → Ver erros
4. Reiniciar frontend: `npm run dev`

### Erro "origin_mismatch" no popup?
1. Ir para https://console.cloud.google.com/apis/credentials
2. Editar o OAuth client ID
3. Verificar se `http://localhost:5176` está em "Authorized JavaScript origins"
4. Se não tiver a porta exata, adicionar

### Erro "invalid_client"?
1. Verificar Client ID - não pode ser "seu-client-id..."
2. Verificar se está igual em ambos .env files
3. Aguardar 2-3 minutos (Google precisa de tempo para propagação)

### Backend diz "Database error"?
1. Executar: `.\setup-postgres.ps1`
2. Aguardar até terminó
3. Reiniciar backend: `npm run dev`

---

## 📋 Checklist Final

- [ ] Projeto criado em console.cloud.google.com
- [ ] Google Identity Services API habilitada
- [ ] OAuth consent screen configurada
- [ ] Web Application OAuth Client ID criado
- [ ] Client ID copiado para frontend/.env
- [ ] Client ID copiado para backend/.env
- [ ] Backend reiniciado (npm run dev)
- [ ] Frontend reiniciado (npm run dev)
- [ ] Teste Google Sign-In passou ✅
- [ ] Teste Email + Senha passou ✅

---

## 🎉 PRONTO!

Seu sistema de autenticação está 100% funcional com:
- ✅ Email + Telefone + Senha
- ✅ Google OAuth
- ✅ JWT tokens com localStorage
- ✅ Planos (free, essencial, premium)
- ✅ Proteção de rotas

**Próximo passo**: Começar Fase 2 (Pix dinâmico + WhatsApp SDK real)

---

**Tempo total**: ~5 minutos  
**Complexidade**: Fácil ⭐  
**Dificuldade**: Nenhuma 😊
