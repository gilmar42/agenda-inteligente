# SETUP Fases 2-4

## 🔐 Fase 2: Credenciais Necessárias

### Pix Dinâmico - Gerencianet (Recomendado)
1. Crie conta em https://gerencianet.com.br
2. Acesse Dashboard → Configurações → API
3. Copie:
   - **Client ID**: `GERENCIANET_CLIENT_ID`
   - **Client Secret**: `GERENCIANET_CLIENT_SECRET`
4. Ambiente sandbox:
   - URL: `https://sandbox.gerencianet.com.br`
   - Adicione ao `.env`:
   ```
   PIX_PROVIDER=gerencianet
   GERENCIANET_CLIENT_ID=seu-client-id
   GERENCIANET_CLIENT_SECRET=seu-secret
   GERENCIANET_SANDBOX=true
   ```

### Alternativa: Asaas
1. Crie conta em https://asaas.com
2. Gere API token em Configurações
3. `.env`:
   ```
   PIX_PROVIDER=asaas
   ASAAS_API_TOKEN=seu-token
   ```

---

### WhatsApp - Twilio
1. Acesse https://www.twilio.com/console
2. Compre número WhatsApp (Business)
3. Copie:
   - **Account SID**: `TWILIO_ACCOUNT_SID`
   - **Auth Token**: `TWILIO_AUTH_TOKEN`
   - **Número WhatsApp**: `TWILIO_WHATSAPP_NUMBER` (ex: +5511987654321)
4. `.env`:
   ```
   WHATSAPP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=seu-sid
   TWILIO_AUTH_TOKEN=seu-token
   TWILIO_WHATSAPP_NUMBER=+5511987654321
   ```

### Alternativa: Z-API (Brasileira, mais barata)
1. Crie conta em https://z-api.io
2. Conecte número WhatsApp (zap seu próprio número)
3. Copie:
   - **API Token**: `ZAPI_TOKEN`
   - **Instance ID**: `ZAPI_INSTANCE`
4. `.env`:
   ```
   WHATSAPP_PROVIDER=zapi
   ZAPI_TOKEN=seu-token
   ZAPI_INSTANCE=seu-instance-id
   ```

---

### Webhooks - Secrets
Para validar webhooks, gere keys aleatórias:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Adicione ao `.env`:
```
GERENCIANET_WEBHOOK_SECRET=seu-secret-aleatorio
ASAAS_WEBHOOK_SECRET=seu-secret-aleatorio
```

---

## 📦 Instalação de Dependências

### Backend - Fase 2
```bash
cd backend

# Pix dinâmico
npm install axios node-querystring

# WhatsApp Twilio
npm install twilio

# (Opcional) Z-API já usa fetch nativo
```

### Frontend - Fase 3
```bash
cd frontend

# Calendário
npm install react-calendar

# Gráficos
npm install recharts

# Data formatting
npm install date-fns
```

### Mobile - Fase 4
```bash
npx create-expo-app agenda-mobile
cd agenda-mobile

npm install \
  @react-navigation/native @react-navigation/bottom-tabs \
  @react-native-async-storage/async-storage \
  axios zustand react-native-calendars

# Push notifications
npm install expo-notifications
```

---

## 🧪 Testes em Sandbox

### Testar Gerencianet QR Code
```bash
curl -X POST http://localhost:3001/pix/dynamic \
  -H "Authorization: Bearer <seu-token>" \
  -H "Content-Type: application/json" \
  -d '{"appointmentId":"uuid","amount":99.90}'
```

Resposta esperada:
```json
{
  "ok": true,
  "qrCode": "00020126580014...",
  "txid": "12345678901234567890123456789012",
  "expiresAt": "2025-12-07"
}
```

### Simular Webhook de Pagamento (Dev)
```bash
curl -X POST http://localhost:3001/webhooks/pix/gerencianet \
  -H "Content-Type: application/json" \
  -H "X-Gerencianet-Signature: <hash>" \
  -d '{
    "event": "charge.confirmed",
    "data": {
      "brcode": "12345678901234567890123456789012"
    }
  }'
```

### Testar WhatsApp Twilio
```bash
curl -X POST http://localhost:3001/test/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+5511987654321",
    "message": "Teste da integração WhatsApp!"
  }'
```

---

## 🚀 Deploy Fase 2

### 1. Gerar Migration SQL
```sql
-- backend/infra/migrations/001-pix-transactions.sql
CREATE TABLE pix_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointment(id) ON DELETE CASCADE,
  fee_ledger_id UUID REFERENCES fee_ledger(id),
  amount DECIMAL(10,2) NOT NULL,
  qr_code TEXT,
  txid VARCHAR(140) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_pix_txid ON pix_transaction(txid);
CREATE INDEX idx_pix_appointment ON pix_transaction(appointment_id);
```

### 2. Aplicar Migration
```bash
psql -h localhost -U app -d agenda -f infra/migrations/001-pix-transactions.sql
```

### 3. Envs de Produção
Copie `.env.example` para `.env.production`:
```bash
cp backend/.env.example backend/.env.production
```

Edite com credenciais reais (não sandbox).

### 4. GitHub Actions (CI/CD atualizado)
Adicione secrets ao GitHub:
- `GERENCIANET_CLIENT_ID`
- `GERENCIANET_CLIENT_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- Etc.

### 5. Deploy
```bash
# Produção
npm run build
npm start -- --env production
```

---

## 📋 Checklist Fase 2

- [ ] Contas criadas (Gerencianet/Asaas + Twilio/Z-API)
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências npm instaladas
- [ ] Migrations de banco aplicadas
- [ ] QR Code dinâmico testado em sandbox
- [ ] Webhooks recebendo em localhost (ngrok)
- [ ] WhatsApp enviando mensagens reais
- [ ] Testes de integração passando
- [ ] GitHub Actions com secrets configured
- [ ] Deploy em staging
- [ ] Teste E2E com pagamento real (R$1)
- [ ] Documentação atualizada

---

## 🔗 Recursos Úteis

### Gerencianet
- Docs: https://gerencianet.com.br/api
- Dashboard: https://app.gerencianet.com.br
- Suporte: contato@gerencianet.com.br

### Twilio WhatsApp
- Console: https://www.twilio.com/console
- Docs: https://www.twilio.com/docs/whatsapp
- Pricing: https://www.twilio.com/en-us/sms/pricing

### Z-API
- Dashboard: https://dashboard.z-api.io
- Docs: https://z-api.io/docs
- Suporte: suporte@z-api.io

---

**Atualizado**: Dezembro 2025  
**Status**: Pronto para implementação Fase 2
