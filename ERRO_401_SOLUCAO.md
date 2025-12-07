# 🚨 ERRO 401: invalid_client - SOLUÇÃO RÁPIDA

## ❌ O PROBLEMA

```
Erro 401: invalid_client
The OAuth client was not found.
```

**Causa**: Google Client ID ainda está com valor placeholder `seu-client-id.apps.googleusercontent.com`

**Solução**: Substituir por Client ID real do Google Cloud Console

---

## ✅ SOLUÇÃO RÁPIDA (10 MINUTOS)

### PASSO 1: Criar Projeto Google Cloud (2 min)

1. Acesse: **https://console.cloud.google.com**
2. Clique em **"Select a Project"** (topo esquerdo)
3. Clique em **"NEW PROJECT"**
4. Nome: `agenda-inteligente`
5. Clique **CREATE**
6. Aguarde 1-2 minutos

---

### PASSO 2: Ativar Google Identity API (1 min)

1. No projeto criado, vá em **APIs & Services > Library**
2. Procure: `Google Identity Services`
3. Clique no resultado
4. Clique **ENABLE**

---

### PASSO 3: Configurar OAuth Consent Screen (2 min)

1. Vá em **APIs & Services > OAuth consent screen**
2. Selecione **External** → **CREATE**
3. Preencha:
   - **App name**: `Agenda Inteligente`
   - **User support email**: gilmar40dutra@gmail.com
   - **Developer contact**: gilmar40dutra@gmail.com
4. Clique **SAVE AND CONTINUE** (3 vezes até chegar ao Summary)
5. **BACK TO DASHBOARD**

---

### PASSO 4: Criar OAuth Client ID (3 min)

1. Vá em **APIs & Services > Credentials**
2. Clique **+ CREATE CREDENTIALS**
3. Selecione **OAuth client ID**
4. Application type: **Web application**
5. Name: `Agenda Inteligente Web`
6. Em **Authorized JavaScript origins**, adicione:
   ```
   http://localhost:5173
   http://localhost:5175
   http://localhost:5176
   http://localhost:3001
   ```
7. Em **Authorized redirect URIs**, adicione:
   ```
   http://localhost:5173
   http://localhost:5175
   http://localhost:5176
   http://localhost:3001
   http://localhost:3001/auth/google
   ```
8. Clique **CREATE**
9. **COPIE O CLIENT ID** (formato: `123456789-abc...xyz.apps.googleusercontent.com`)

---

### PASSO 5: Atualizar .env Files (1 min)

#### Frontend: `frontend/.env`
```bash
# ANTES (❌ ERRADO):
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com

# DEPOIS (✅ CORRETO):
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

#### Backend: `backend/.env`
```bash
# Adicione (se não tiver):
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

⚠️ **IMPORTANTE**: Use o MESMO Client ID em ambos!

---

### PASSO 6: Reiniciar Frontend (1 min)

```powershell
# Pare o frontend atual (Ctrl+C no terminal)
# Depois reinicie:
cd frontend
npm run dev -- --host
```

---

### PASSO 7: Testar (1 min)

1. Acesse: http://localhost:5175
2. Clique em **"Sign up with Google"** ou **"Login"**
3. Clique em **"Sign in with Google"**
4. Popup Google deve abrir
5. Faça login com gilmar40dutra@gmail.com
6. Deve funcionar! ✅

---

## 🎯 VERIFICAÇÃO RÁPIDA

### Antes de Reiniciar:
```powershell
# Verificar se Client ID foi copiado corretamente
cd frontend
Get-Content .env | Select-String "VITE_GOOGLE_CLIENT_ID"

# Deve mostrar algo como:
# VITE_GOOGLE_CLIENT_ID=123456789-abc...xyz.apps.googleusercontent.com
```

### Depois de Reiniciar:
```
1. Abra DevTools (F12)
2. Console → Digite:
   console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)
3. Deve mostrar o Client ID real (não "seu-client-id...")
```

---

## 🔍 ERRO PERSISTINDO?

### "origin_mismatch" ou "redirect_uri_mismatch"
**Solução**:
1. Volte em https://console.cloud.google.com/apis/credentials
2. Edite o OAuth client ID
3. Adicione TODAS essas origins:
   ```
   http://localhost:5173
   http://localhost:5175
   http://localhost:5176
   http://localhost:3001
   ```
4. Aguarde 2-3 minutos (Google precisa propagar)

### "Access blocked: This app's request is invalid"
**Solução**:
1. OAuth consent screen não está completo
2. Volte em OAuth consent screen
3. Preencha todos os campos obrigatórios
4. Adicione seu email em "Test users"

### Client ID não muda no frontend
**Solução**:
1. Limpe cache do navegador (Ctrl+Shift+Del)
2. Pare frontend (Ctrl+C)
3. Reinicie: `npm run dev -- --host`
4. Aguarde 5 segundos
5. Recarregue página (F5)

---

## 📊 RESUMO VISUAL

```
❌ PROBLEMA:
   VITE_GOOGLE_CLIENT_ID = seu-client-id.apps.googleusercontent.com
   (valor fake/placeholder)

✅ SOLUÇÃO:
   1. console.cloud.google.com
   2. Criar projeto
   3. Ativar API
   4. OAuth consent screen
   5. Criar OAuth Client ID
   6. Copiar Client ID
   7. Colar em .env
   8. Reiniciar frontend
   9. Testar!

⏱️ TEMPO: ~10 minutos
```

---

## 🎓 ENTENDENDO O ERRO

**Erro 401: invalid_client** significa:
- Google não reconhece o Client ID enviado
- Pode ser:
  - ❌ Client ID é placeholder/fake
  - ❌ Client ID não existe no Google
  - ❌ Client ID foi deletado
  - ❌ Projeto Google Cloud foi suspenso

**Solução**: Criar Client ID real no Google Cloud Console

---

## 🚀 ALTERNATIVA: Testar Sem Google OAuth

Se não quiser configurar agora, você pode:

### Teste com Email + Senha
```
1. http://localhost:5175/signup
2. Preencha:
   - Nome: Seu Nome
   - Email: teste@example.com
   - Telefone: 11999999999
   - Senha: Senha123!
3. Clique "Cadastrar"
4. Funciona sem Google OAuth! ✅
```

Mas isso requer **PostgreSQL** rodando.

---

## 📋 CHECKLIST FINAL

- [ ] Acessei console.cloud.google.com
- [ ] Criei novo projeto "agenda-inteligente"
- [ ] Ativei Google Identity Services API
- [ ] Configurei OAuth consent screen (External)
- [ ] Adicionei meu email em Test users
- [ ] Criei OAuth Client ID (Web application)
- [ ] Adicionei todas origins (localhost:5173, 5175, 5176, 3001)
- [ ] Copiei Client ID
- [ ] Colei em frontend/.env (VITE_GOOGLE_CLIENT_ID)
- [ ] Colei em backend/.env (GOOGLE_CLIENT_ID)
- [ ] Reiniciei frontend (npm run dev)
- [ ] Testei no navegador
- [ ] Google popup abre corretamente ✅

---

## 💡 DICA IMPORTANTE

**Guarde o Client ID em algum lugar seguro!**
- Você vai usar esse mesmo ID em produção
- Só vai mudar as origins para seu domínio real
- Não precisa criar novo Client ID toda vez

---

**Próximo**: Siga os passos acima e depois teste novamente!  
**Tempo**: ~10 minutos  
**Resultado**: Google OAuth 100% funcional ✅

