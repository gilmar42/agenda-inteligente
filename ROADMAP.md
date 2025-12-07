# Agenda Inteligente - Roadmap

## Visão Geral
Plataforma SaaS de agendamentos para micro e pequenos empresários (autônomos) com integração WhatsApp, cobrança Pix automática e analytics.

**Status MVP**: ✅ Concluído  
**Próximas Fases**: 2, 3, 4 (2025-2026)

---

## Fase 1: MVP (✅ Concluído)
**Timeline**: Outubro - Dezembro 2025  
**Status**: Pronto para produção

### Entregáveis
- ✅ Autenticação (email/telefone + password, Google OAuth)
- ✅ Agendamentos CRUD com plan gating
- ✅ Persistência PostgreSQL com TypeORM
- ✅ JWT token management
- ✅ WhatsApp stub (pronto para SDK real)
- ✅ Pix QR Code estático (MVP)
- ✅ Fee ledger tracking
- ✅ Dark/Light theme UI
- ✅ CI/CD GitHub Actions
- ✅ Testes backend (Jest)

### Planos (3 camadas de monetização)
| Plano | Preço | Recursos |
|-------|-------|----------|
| Gratuito | R$0 | Agendamentos básicos, sem WhatsApp |
| Essencial | R$49.90/mês | WhatsApp confirmação + lembretes |
| Premium | R$89.90/mês | WhatsApp + Pix + analytics avançado |

---

## Fase 2: Pagamentos & Notificações Reais
**Timeline**: Janeiro - Fevereiro 2026  
**Estimativa**: 40 h  
**Prioridade**: ALTA (Monetização)

### 2.1 Pix Dinâmico (QR Code Dinâmico)
**Objetivo**: Gerar QR Code único por transação com confirmação automática

#### 2.1.1 Integração Gerencianet
```javascript
// backend/src/services/PixService.js
async generateViaGerencianet(amount, orderId) {
  const response = await fetch('https://api.gerencianet.com.br/v1/qrcode', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      calendar: {
        expiration_date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]
      },
      trinformation: {
        reference_label: `AGD-${orderId}`
      },
      amount: {
        value: Math.round(amount * 100) // em centavos
      }
    })
  })
  const data = await response.json()
  return {
    qrCode: data.qrcode,
    txid: data.brcode,
    expiresAt: data.calendar.expiration_date
  }
}
```

#### 2.1.2 Alternativa: Asaas
```javascript
// Integração Asaas (mais simples)
async generateViaAsaas(amount, orderId) {
  const response = await fetch('https://api.asaas.com/v3/pix/dict', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${this.apiKey}` }
  })
  // ... retorna chave Pix registrada
}
```

#### 2.1.3 Banco de Dados - Transação Pix
```sql
-- backend/infra/migrations/add_pix_transactions.sql
CREATE TABLE pix_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointment(id),
  fee_ledger_id UUID REFERENCES fee_ledger(id),
  amount DECIMAL(10,2) NOT NULL,
  qr_code TEXT,
  txid VARCHAR(140),
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, expired, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

#### 2.1.4 Rota Dinâmica
```javascript
app.post('/pix/dynamic', verifyToken, requirePlan('premium'), async (req, res) => {
  const { appointmentId, amount } = req.body
  
  // Validar appointment pertence ao usuário
  const appointment = await appointmentRepo.findOne({
    where: { id: appointmentId, professional: { id: req.userId } }
  })
  
  // Gerar QR dinâmico
  const pixService = new PixService(process.env.PIX_PROVIDER, process.env.PIX_API_KEY)
  const { qrCode, txid, expiresAt } = await pixService.generateViaGerencianet(amount, appointmentId)
  
  // Salvar transação
  const txn = await pixTransactionRepo.save({
    appointmentId,
    amount,
    qrCode,
    txid,
    expiresAt
  })
  
  return res.json({ ok: true, qrCode, txid, expiresAt })
})
```

**Aceitação**: 
- [ ] QR Code gerado com txid único
- [ ] Expiração em 24h configurável
- [ ] Teste com conta Gerencianet/Asaas sandbox

---

### 2.2 Webhooks de Pagamento
**Objetivo**: Automatizar confirmação de pagamento e atualizar FeeLedger

#### 2.2.1 Endpoints Webhook
```javascript
// backend/src/routes/webhooks.js

// Gerencianet webhook
app.post('/webhooks/pix/gerencianet', async (req, res) => {
  const { event, data } = req.body
  
  if (event === 'charge.confirmed') {
    const txn = await pixTransactionRepo.findOne({ where: { txid: data.brcode } })
    
    if (txn) {
      // Marcar pagamento como confirmado
      await pixTransactionRepo.update(txn.id, {
        status: 'confirmed',
        confirmedAt: new Date()
      })
      
      // Atualizar FeeLedger
      await feeLedgerRepo.update(
        { appointmentId: txn.appointmentId },
        { status: 'charged', paidAt: new Date() }
      )
      
      // Notificar cliente via WhatsApp
      // "Pagamento confirmado! Agendamento + detalhes"
    }
  }
  
  return res.json({ ok: true })
})

// Asaas webhook
app.post('/webhooks/pix/asaas', async (req, res) => {
  // Similar structure
})
```

#### 2.2.2 Segurança Webhook
```javascript
// Validar assinatura Gerencianet
import crypto from 'crypto'

const verifyGerencianetSignature = (req) => {
  const signature = req.headers['x-gerencianet-signature']
  const body = JSON.stringify(req.body)
  const hash = crypto
    .createHmac('sha256', process.env.PIX_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  return hash === signature
}
```

**Aceitação**:
- [ ] Webhook recebe evento de pagamento
- [ ] FeeLedger atualizado para `charged`
- [ ] Appointment marcado como `pixPaid: true`
- [ ] WhatsApp enviado confirmando pagamento

---

### 2.3 Integração Real WhatsApp
**Objetivo**: Usar SDK Twilio ou Z-API em produção

#### 2.3.1 Twilio SDK
```javascript
// npm install twilio

import twilio from 'twilio'

export class WhatsAppTwilio {
  constructor(accountSid, authToken, fromPhone) {
    this.client = twilio(accountSid, authToken)
    this.fromPhone = fromPhone
  }
  
  async sendConfirmation(to, appointment) {
    const message = `Olá ${appointment.clientName}! 👋\n\nSua consulta foi agendada para:\n📅 ${appointment.dateTime}\n👨‍💼 Serviço: ${appointment.service}\n\nAceitar? Confirme aqui...`
    
    const msg = await this.client.messages.create({
      body: message,
      from: `whatsapp:${this.fromPhone}`,
      to: `whatsapp:${to}`
    })
    
    return { ok: true, sid: msg.sid }
  }
  
  async sendReminder(to, appointment) {
    const msg = await this.client.messages.create({
      body: `Lembrete: Você tem consulta amanhã às ${appointment.dateTime}!`,
      from: `whatsapp:${this.fromPhone}`,
      to: `whatsapp:${to}`
    })
    
    return { ok: true, sid: msg.sid }
  }
}
```

#### 2.3.2 Z-API (Brasileira, mais simples)
```javascript
// Z-API usa apenas HTTP requests, sem SDK

export class WhatsAppZAPI {
  constructor(apiToken) {
    this.apiToken = apiToken
    this.baseUrl = 'https://api.z-api.io'
  }
  
  async sendConfirmation(to, appointment) {
    const response = await fetch(
      `${this.baseUrl}/instances/${process.env.ZAPI_INSTANCE}/token/${this.apiToken}/send-message`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: to.replace(/\D/g, ''),
          message: `Olá! Sua consulta foi agendada para ${appointment.dateTime}...`
        })
      }
    )
    
    return { ok: response.ok }
  }
}
```

#### 2.3.3 Routes Update
```javascript
app.post('/appointments', verifyToken, requirePlan('essencial', 'premium'), async (req, res) => {
  // ... criar appointment ...
  
  // Enviar WhatsApp real
  const whatsappService = req.userPlan === 'essencial' 
    ? new WhatsAppZAPI(process.env.ZAPI_TOKEN)
    : new WhatsAppTwilio(...)
  
  if (appointment.clientPhone) {
    await whatsappService.sendConfirmation(
      appointment.clientPhone,
      appointment
    )
  }
  
  return res.json({ ok: true, appointment })
})
```

**Aceitação**:
- [ ] Mensagem WhatsApp recebida no celular real
- [ ] Template customizável
- [ ] Retry automático em falha
- [ ] Log de delivery status

---

## Fase 3: Analytics & Calendário Visual
**Timeline**: Março - Abril 2026  
**Estimativa**: 50 h  
**Prioridade**: ALTA (UX)

### 3.1 Calendário (Frontend)
```typescript
// frontend/src/pages/AdminCalendar.tsx
import { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export const AdminCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  
  const handleDateChange = async (date) => {
    setSelectedDate(date)
    // Fetch appointments para aquele dia
    const res = await fetch(
      `/api/appointments?date=${date.toISOString()}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    setAppointments(await res.json())
  }
  
  return (
    <div>
      <Calendar value={selectedDate} onChange={handleDateChange} />
      <AppointmentList appointments={appointments} />
    </div>
  )
}
```

### 3.2 Analytics Dashboard
```javascript
// backend/src/routes/analytics.js

app.get('/analytics/summary', verifyToken, async (req, res) => {
  const { startDate, endDate } = req.query
  
  const stats = await AppDataSource.query(`
    SELECT 
      COUNT(a.id) as total_appointments,
      COUNT(CASE WHEN a.status='completed' THEN 1 END) as completed,
      SUM(fl.fee_amount) as total_fees,
      AVG(fl.fee_amount) as avg_fee,
      COUNT(DISTINCT a.id) as unique_clients
    FROM appointment a
    LEFT JOIN fee_ledger fl ON a.id = fl.appointment_id
    WHERE a.professional_id = $1
      AND a.date_time >= $2
      AND a.date_time <= $3
  `, [req.userId, startDate, endDate])
  
  return res.json({ ok: true, stats: stats[0] })
})

app.get('/analytics/revenue', verifyToken, async (req, res) => {
  // Gráfico de receita por dia/mês
  const revenue = await AppDataSource.query(`
    SELECT 
      DATE(fl.paid_at) as date,
      SUM(fl.fee_amount) as total,
      COUNT(*) as count
    FROM fee_ledger fl
    WHERE fl.user_id = $1
      AND fl.status = 'charged'
    GROUP BY DATE(fl.paid_at)
    ORDER BY date DESC
  `, [req.userId])
  
  return res.json({ ok: true, revenue })
})
```

**Aceitação**:
- [ ] Calendário mostra agendamentos por cor de status
- [ ] Dashboard exibe KPIs principais (receita, agendamentos, taxa)
- [ ] Gráficos de tendência (últimos 30 dias)
- [ ] Filtro por período e status

---

## Fase 4: App Mobile (React Native)
**Timeline**: Maio - Julho 2026  
**Estimativa**: 80 h  
**Prioridade**: MÉDIA (Expansão)

### 4.1 Setup
```bash
npx create-expo-app agenda-mobile
cd agenda-mobile

npm install @react-navigation/native @react-navigation/bottom-tabs
npm install axios zustand @react-oauth/google
```

### 4.2 Estrutura
```
mobile/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   ├── AppointmentDetailScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/
│   │   ├── AppointmentCard.tsx
│   │   └── CalendarDay.tsx
│   ├── services/
│   │   └── api.ts (shared with web)
│   └── App.tsx
```

### 4.3 Shared API Client
```typescript
// shared/src/api.ts
export class AgendaAPI {
  private token: string
  
  async signup(data) { /* ... */ }
  async login(data) { /* ... */ }
  async getAppointments() { /* ... */ }
  async createAppointment(data) { /* ... */ }
  async generatePixQR(appointmentId) { /* ... */ }
}
```

**Aceitação**:
- [ ] Login/Signup funcional
- [ ] Listar agendamentos
- [ ] Criar novo agendamento
- [ ] Ver QR Code Pix
- [ ] Push notifications (Firebase Cloud Messaging)

---

## Dependências & Bloqueadores

### Fase 2
- [ ] Conta Gerencianet ou Asaas (chaves de API)
- [ ] Twilio ou Z-API account (WhatsApp)
- [ ] PostgreSQL rodando com migrations aplicadas

### Fase 3
- [ ] react-calendar library
- [ ] Chart.js ou Recharts para gráficos
- [ ] GET `/appointments?date=` implementado no backend

### Fase 4
- [ ] React Native Expo CLI
- [ ] Firebase (Push notifications)
- [ ] App Store & Google Play accounts (futura distribuição)

---

## Métricas de Sucesso

### MVP (Fase 1) ✅
- ✅ Sistema rodando sem erros críticos
- ✅ Usuários podem criar conta e agendar
- ✅ JWT e autenticação funcionando
- ✅ 3 planos monetários implementados

### Fase 2
- [ ] 1ª transação Pix real processada
- [ ] WhatsApp confirmações recebidas em produção
- [ ] Taxa de conversão Premium > 15%
- [ ] Webhook confiabilidade > 99%

### Fase 3
- [ ] Retenção mensal > 70%
- [ ] 50+ agendamentos/dia em produção
- [ ] Analytics dashboard usado por 80% users

### Fase 4
- [ ] 5k+ downloads iOS + Android
- [ ] Rating > 4.5 stars
- [ ] DAU > 1k usuarios

---

## Estimativa de Custo (Fase 2-4)

| Serviço | Custo Mensal | Nota |
|---------|-------------|------|
| Gerencianet/Asaas | R$29 - R$99 | Taxa Pix 0% |
| Twilio WhatsApp | R$0.10 msg | ~R$500-2k/mês |
| Z-API | R$0.15 msg | ~R$500-2k/mês |
| Firebase | R$0 - R$100 | Push notifications |
| AWS/Heroku | R$50 - R$200 | Hosting produção |
| PostgreSQL | R$0 - R$100 | Managed database |

**Total estimado**: R$500-3k/mês em produção

---

## Next Steps

1. **Semana 1**: Setup Gerencianet/Asaas account, obter sandbox keys
2. **Semana 2**: Implementar dynamic Pix QR via API
3. **Semana 3**: Webhooks de pagamento e testes
4. **Semana 4**: SDK Twilio/Z-API integrado
5. **Janeiro 2026**: Deploy Fase 2 para produção

---

## Links Úteis

- [Gerencianet Docs](https://gerencianet.com.br/api)
- [Asaas Docs](https://asaas.com/api/)
- [Twilio WhatsApp](https://www.twilio.com/whatsapp)
- [Z-API Docs](https://z-api.io)
- [React Calendar](https://react-calendar.tech/)
- [Expo Docs](https://docs.expo.dev/)

---

**Última atualização**: Dezembro 2025  
**Mantido por**: Agenda Inteligente Team  
**Status**: ✅ Pronto para Fase 2
