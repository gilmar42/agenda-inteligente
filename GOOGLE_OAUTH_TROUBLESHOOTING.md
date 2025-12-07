# 🔧 Autenticação Google - Guia Rápido de Troubleshooting

## ✅ Problemas Corrigidos

### 1. Login.tsx estava incompleto ✅ CORRIGIDO
**Problema**: Componente Login.tsx tinha apenas botões vazios sem lógica.  
**Solução**: Implementado formulário completo com validação e integração com API.

### 2. Detecção Email vs Telefone ✅ CORRIGIDO
**Problema**: Backend espera `email` E `phone` como campos separados, não `emailOrPhone`.  
**Solução**: Frontend agora detecta se entrada é email (contém `@`) ou telefone e envia correspondentemente.

---

## 🚀 Configuração Rápida (5 minutos)

### Passo 1: Criar Google OAuth Client ID

**Acesse**: https://console.cloud.google.com

1. **Create Project** → Nome: `agenda-inteligente`
2. **APIs & Services > Library** → Procure `Google Identity Services`
3. **Enable** a API
4. **APIs & Services > OAuth consent screen**
   - User Type: `External`
   - App name: `Agenda Inteligente`
   - User support email: Seu email
   - Developer contact: Seu email
5. **Credentials > + Create Credentials > OAuth client ID**
   - Application type: `Web application`
   - **Authorized redirect URIs**: Adicione:
     ```
     http://localhost:3001
     http://localhost:5173
     http://localhost:5176
     http://localhost:5000
     ```
6. **Copy Client ID** (formato: `123456789.apps.googleusercontent.com`)

---

### Passo 2: Configurar Variáveis de Ambiente

#### Backend: `backend/.env`
```bash
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

#### Frontend: `frontend/.env`
```bash
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

⚠️ **IMPORTANTE**: Ambos devem ter o MESMO Client ID

---

### Passo 3: Reiniciar Serviços

```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev -- --host
```

---

## 🧪 Testes

### Teste 1: Signup com Email + Senha
1. Acesse: http://localhost:5176/signup
2. Preencha:
   - Nome: `Teste User`
   - Email: `teste@example.com`
   - Telefone: `11999999999`
   - Senha: `Senha123!`
   - Confirmar: `Senha123!`
3. Clique em **Cadastrar**
4. **Esperado**: Redireciona para `/admin`

### Teste 2: Login com Email + Senha
1. Acesse: http://localhost:5176/login
2. Preencha:
   - Email/Telefone: `teste@example.com`
   - Senha: `Senha123!`
3. Clique em **Entrar**
4. **Esperado**: Redireciona para `/admin`

### Teste 3: Google Sign-In (com Client ID)
1. Acesse: http://localhost:5176/signup ou http://localhost:5176/login
2. Clique em **Sign in with Google** ou **Sign up with Google**
3. **Popup abre** → Faça login com sua conta Google
4. **Esperado**: Redireciona para `/admin`

---

## ❌ Erros Comuns e Soluções

### Erro: "Client ID não funcionando / popup vazio"
```
Causa: VITE_GOOGLE_CLIENT_ID não está configurado
Solução:
1. Verifique frontend/.env
2. Copie Client ID de https://console.cloud.google.com/apis/credentials
3. Certifique-se de que não é "seu-client-id..." (placeholder)
4. Reinicie frontend: npm run dev
```

### Erro: "invalid_client" ou "origin_mismatch"
```
Causa: Client ID incorreto ou origem não está autorizada
Solução:
1. Verifique Client ID em https://console.cloud.google.com/apis/credentials
2. Adicione URIs em "Authorized redirect URIs":
   - http://localhost:3001
   - http://localhost:5173
   - http://localhost:5176 (se frontend usar essa porta)
   - http://localhost:5000
3. Aguarde 2-3 minutos para propagação
4. Teste novamente
```

### Erro: "popup_closed_by_user"
```
Causa: Popup foi fechado durante login
Solução: Clique novamente em "Sign in with Google"
```

### Erro: "Backend não respondendo" ou "Erro de conexão"
```
Causa: Backend não está rodando ou banco de dados não está acessível
Solução:
1. Verifique se backend está rodando: npm run dev em terminal
2. Teste health: curl http://localhost:3001/health
3. Verifique se PostgreSQL está rodando: docker ps | findstr agenda-db
4. Se PostgreSQL não estiver, execute: .\setup-postgres.ps1
```

### Erro: "Invalid credentials" no login
```
Causa: Email/senha incorretos ou usuário não existe
Solução:
1. Verifique email/telefone digitado
2. Verifique se senha está correta
3. Se não tem conta, faça signup primeiro
```

---

## 🔍 Debug DevTools

### No Frontend (Browser Console - F12)
```javascript
// Verificar se Client ID está configurado
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)
// Deve mostrar: 123456789.apps.googleusercontent.com

// Verificar se token está salvo
console.log(localStorage.getItem('authToken'))
// Deve mostrar: eyJhbGciOiJIUzI1NiI... (JWT token)

// Verificar erro de CORS
// Veja na aba Network se há erro de CORS
```

### No Backend (Terminal)
```bash
# Ver logs em tempo real
npm run dev

# Deve mostrar:
# [Startup] Database initialized
# Backend listening on 3001
# [Login] User authenticated
# [Google Auth] User persisted
```

---

## 📋 Checklist Final

- [ ] Google Client ID criado em console.cloud.google.com
- [ ] Client ID copiado para `backend/.env` (GOOGLE_CLIENT_ID)
- [ ] Client ID copiado para `frontend/.env` (VITE_GOOGLE_CLIENT_ID)
- [ ] Todas as URIs de localhost adicionadas em Credentials
- [ ] Backend reiniciado (`npm run dev`)
- [ ] Frontend reiniciado (`npm run dev -- --host`)
- [ ] Teste signup com email + senha ✅
- [ ] Teste login com email + senha ✅
- [ ] Teste Google Sign-In ✅

---

## 🚀 Próximos Passos

Após testes passarem:

1. **Configurar PostgreSQL** (se não tiver):
   ```powershell
   .\setup-postgres.ps1
   ```

2. **Testar Agendamentos**:
   ```bash
   curl -X POST http://localhost:3001/appointments \
     -H "Authorization: Bearer {TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "clientName": "Maria",
       "clientPhone": "11988888888",
       "service": "Corte",
       "dateTime": "2025-12-10T14:00:00Z"
     }'
   ```

3. **Começar Fase 2** (Pix dinâmico + WhatsApp SDK real)

---

**Versão**: 1.0.0  
**Data**: 6 de Dezembro 2025  
**Status**: ✅ Pronto para testes
