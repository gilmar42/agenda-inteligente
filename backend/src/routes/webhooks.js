// Webhooks para confirmação de pagamento Pix
// backend/src/routes/webhooks.js

import express from 'express'
import { AppDataSource } from '../server.js'
import { PixService } from '../services/PixService.js'
import { WhatsAppService } from '../services/WhatsAppService.js'

const router = express.Router()

// Inicializar services
const pixService = new PixService(
  process.env.PIX_PROVIDER,
  process.env.PIX_API_KEY
)

const whatsappService = new WhatsAppService(
  process.env.WHATSAPP_PROVIDER,
  process.env.WHATSAPP_API_KEY
)

// ============ GERENCIANET WEBHOOK ============
router.post('/pix/gerencianet', async (req, res) => {
  try {
    // Validar assinatura
    if (!pixService.verifyGerencianetSignature(req)) {
      return res.status(401).json({ ok: false, error: 'Invalid signature' })
    }

    const { event, data } = req.body
    console.log('[Webhook] Gerencianet event:', event)

    // Só processar eventos de cobrança confirmada
    if (event !== 'charge.confirmed') {
      return res.json({ ok: true })
    }

    const pixTransactionRepo = AppDataSource.getRepository('PixTransaction')
    const feeLedgerRepo = AppDataSource.getRepository('FeeLedger')
    const appointmentRepo = AppDataSource.getRepository('Appointment')

    // Buscar transação pelo txid
    const txn = await pixTransactionRepo.findOne({
      where: { txid: data.brcode }
    })

    if (!txn) {
      console.warn('[Webhook] Transação não encontrada:', data.brcode)
      return res.json({ ok: true }) // Retornar 200 mesmo assim
    }

    // Marcar transação como confirmada
    await pixTransactionRepo.update(
      { id: txn.id },
      {
        status: 'confirmed',
        confirmedAt: new Date()
      }
    )

    // Atualizar FeeLedger
    await feeLedgerRepo.update(
      { appointmentId: txn.appointmentId },
      {
        status: 'charged',
        paidAt: new Date()
      }
    )

    // Atualizar Appointment
    await appointmentRepo.update(
      { id: txn.appointmentId },
      { pixPaid: true }
    )

    // Buscar appointment para notificar cliente
    const appointment = await appointmentRepo.findOne({
      where: { id: txn.appointmentId }
    })

    // Enviar WhatsApp de confirmação
    if (appointment.clientPhone) {
      await whatsappService.sendConfirmation(
        appointment.clientPhone,
        {
          clientName: appointment.clientName,
          service: appointment.service,
          dateTime: appointment.dateTime,
          paymentStatus: 'confirmed'
        }
      )
    }

    console.log('[Webhook] Pagamento processado:', txn.id)
    return res.json({ ok: true })

  } catch (error) {
    console.error('[Webhook Error]', error)
    // Retornar 500 para retry automático
    return res.status(500).json({ ok: false, error: error.message })
  }
})

// ============ ASAAS WEBHOOK ============
router.post('/pix/asaas', async (req, res) => {
  try {
    // Validar assinatura
    if (!pixService.verifyAsaasSignature(req)) {
      return res.status(401).json({ ok: false, error: 'Invalid signature' })
    }

    const { event, payment } = req.body
    console.log('[Webhook] Asaas event:', event)

    // Eventos relevantes: PAYMENT_CONFIRMED, PAYMENT_RECEIVED
    if (!['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(event)) {
      return res.json({ ok: true })
    }

    const pixTransactionRepo = AppDataSource.getRepository('PixTransaction')
    const feeLedgerRepo = AppDataSource.getRepository('FeeLedger')
    const appointmentRepo = AppDataSource.getRepository('Appointment')

    // Buscar transação pelo payment ID (Asaas usa ID diferente)
    const txn = await pixTransactionRepo.findOne({
      where: { txid: payment.id }
    })

    if (!txn) {
      console.warn('[Webhook] Transação não encontrada:', payment.id)
      return res.json({ ok: true })
    }

    // Marcar como confirmada
    await pixTransactionRepo.update(
      { id: txn.id },
      {
        status: 'confirmed',
        confirmedAt: new Date()
      }
    )

    // Atualizar FeeLedger
    await feeLedgerRepo.update(
      { appointmentId: txn.appointmentId },
      {
        status: 'charged',
        paidAt: new Date()
      }
    )

    // Atualizar Appointment
    await appointmentRepo.update(
      { id: txn.appointmentId },
      { pixPaid: true }
    )

    // Notificar cliente
    const appointment = await appointmentRepo.findOne({
      where: { id: txn.appointmentId }
    })

    if (appointment.clientPhone) {
      await whatsappService.sendConfirmation(
        appointment.clientPhone,
        {
          clientName: appointment.clientName,
          service: appointment.service,
          dateTime: appointment.dateTime,
          paymentStatus: 'confirmed'
        }
      )
    }

    console.log('[Webhook] Pagamento Asaas processado:', txn.id)
    return res.json({ ok: true })

  } catch (error) {
    console.error('[Asaas Webhook Error]', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
})

// ============ TESTE - Simular webhook localmente ============
// Para testes: curl -X POST http://localhost:3001/webhooks/test/simulate \
//   -H "Content-Type: application/json" \
//   -d '{"provider":"gerencianet","txid":"seu-txid"}'

router.post('/test/simulate', async (req, res) => {
  // APENAS para desenvolvimento local
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ ok: false, error: 'Webhook simulation disabled in production' })
  }

  const { provider, txid } = req.body

  try {
    const pixTransactionRepo = AppDataSource.getRepository('PixTransaction')
    const feeLedgerRepo = AppDataSource.getRepository('FeeLedger')

    // Simular confirmação
    const txn = await pixTransactionRepo.findOne({ where: { txid } })
    if (!txn) {
      return res.status(404).json({ ok: false, error: 'Transação não encontrada' })
    }

    // Processar como webhook real
    await pixTransactionRepo.update(
      { id: txn.id },
      { status: 'confirmed', confirmedAt: new Date() }
    )

    await feeLedgerRepo.update(
      { appointmentId: txn.appointmentId },
      { status: 'charged', paidAt: new Date() }
    )

    return res.json({
      ok: true,
      message: 'Webhook simulado com sucesso',
      transaction: txn
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
})

export default router
