# 🔐 Configurar Google OAuth - Agenda Inteligente

## 📋 Pré-requisitos
- Conta Google (qualquer uma)
- Acesso a https://console.cloud.google.com
- 5 minutos

---

## ✅ Passo 1: Criar Projeto Google Cloud

1. Acesse https://console.cloud.google.com
2. Clique em **"Select a Project"** (topo esquerdo)
3. Clique em **"NEW PROJECT"**
4. Preencha:
   - **Project name**: `agenda-inteligente`
   - **Organization** (opcional): Deixe em branco
5. Clique em **"CREATE"**
6. Aguarde 1-2 minutos pela criação

---

## ✅ Passo 2: Habilitar Google Identity Services API

1. Com o projeto criado, acesse **APIs & Services > Library**
2. Procure por: `Google Identity Services`
3. Clique no resultado (não é "Identity and Access Management")
4. Clique em **"ENABLE"**

---

## ✅ Passo 3: Criar OAuth 2.0 Client ID

### A) Configurar OAuth Consent Screen
1. Vá em **APIs & Services > OAuth consent screen**
2. Selecione **User Type**: `External`
3. Clique em **"CREATE"**

4. Preencha os campos obrigatórios:
   - **App name**: `Agenda Inteligente`
   - **User support email**: Seu email
   - **Developer contact**: Seu email
5. Clique em **"SAVE AND CONTINUE"**

6. **Scopes** (deixar como está, pular):
   - Clique em **"SAVE AND CONTINUE"**

7. **Test users** (adicionar sua conta):
   - Clique em **"ADD USERS"**
   - Adicione seu email
   - Clique em **"SAVE AND CONTINUE"**

8. **Summary** - Clique em **"BACK TO DASHBOARD"**

### B) Criar Client ID
1. Vá em **APIs & Services > Credentials**
2. Clique em **"+ CREATE CREDENTIALS"**
3. Selecione **"OAuth client ID"**
4. Escolha **Application type**: `Web application`

5. Preencha **Authorized redirect URIs**:
```
http://localhost:3001
http://localhost:3001/auth/google
http://localhost:5173
http://localhost:5176
http://localhost:5000
```

6. Clique em **"CREATE"**

7. **Copie o Client ID** que aparecerá (algo como: `123456789.apps.googleusercontent.com`)

---

## ✅ Passo 4: Configurar Variáveis de Ambiente

### Backend (.env)
```bash
cd backend
# Edite o arquivo .env
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

### Frontend (.env)
```bash
cd frontend
# Edite o arquivo .env
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

**Ambos devem ter o MESMO Client ID**

---

## ✅ Passo 5: Reiniciar Backend e Frontend

```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev -- --host
```

---

## 🧪 Passo 6: Testar

1. Acesse: http://localhost:5176
2. Clique em **"Sign in with Google"** (página de login)
3. Faça login com sua conta Google
4. **Deve redirecionar para Admin Dashboard**

---

## ❌ Troubleshooting

### Erro: "popup_closed_by_user"
- Popup de login foi fechado
- Clique novamente em "Sign in with Google"

### Erro: "invalid_client"
- Client ID incorreto ou inválido
- Verifique se copiou corretamente
- Verifique se está usando o MESMO em frontend e backend

### Erro: "origin_mismatch"
- Origem não está na whitelist do Google
- Verifique se adicionou `http://localhost:5173` e `http://localhost:5176` em Credentials
- **Atenção**: Porta pode mudar se 5173 estiver em uso (neste caso é 5176)

### Erro: "redirect_uri_mismatch"
- Verifique as URIs em **APIs & Services > Credentials > OAuth client ID**
- Adicione todas as portas que o frontend está usando

### Nada acontece ao clicar
- Abra DevTools (F12)
- Veja se há erro no console
- Procure por: `VITE_GOOGLE_CLIENT_ID` ou `Cross-Origin`

---

## 🔍 Verificar Configuração

### No Frontend
```javascript
// Abra DevTools (F12) e execute no console:
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)
// Deve mostrar o Client ID (não "seu-client-id...")
```

### No Backend
```bash
curl http://localhost:3001/health -H "Authorization: Bearer test"
# Se retornar 200, backend está pronto para receber Google tokens
```

---

## 📱 Google Sign-In Flow Completo

```
1. User clica em "Sign in with Google"
   ↓
2. Google popup abre → user faz login
   ↓
3. Google retorna `credential` (JWT signed)
   ↓
4. Frontend envia POST /auth/google com o credential
   ↓
5. Backend valida JWT signature com Google Public Key
   ↓
6. Backend cria/busca user no banco
   ↓
7. Backend retorna JWT token + user data
   ↓
8. Frontend salva token em localStorage
   ↓
9. Frontend redireciona para /admin
```

---

## 📚 Referências

- **Google Cloud Console**: https://console.cloud.google.com
- **Google Identity Docs**: https://developers.google.com/identity/gsi/web
- **OAuth 2.0 Playground**: https://developers.google.com/oauthplayground

---

## ✅ Checklist Final

- [ ] Projeto Google Cloud criado
- [ ] Google Identity Services API habilitada
- [ ] OAuth consent screen configurada
- [ ] Web Application OAuth Client ID criado
- [ ] Client ID copiado para frontend/.env
- [ ] Client ID copiado para backend/.env
- [ ] Localhost URIs adicionadas em Credentials
- [ ] Backend e frontend reiniciados
- [ ] Teste Google Sign-In na página de login

---

**Próximo passo**: Após configurar, teste o signup/login normal também (email + password)

