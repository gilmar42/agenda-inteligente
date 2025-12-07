// Pix payment service
// Supports Gerencianet and Asaas

export class PixService {
  constructor(provider = 'gerencianet', apiKey = null) {
    this.provider = provider
    this.apiKey = apiKey
  }

  // Generate static EMV QR code (MVP - no dynamic QR yet)
  async generateStaticQRCode(amount = null) {
    // Static EMV QR Code format (simplified)
    const qrCode = '00020126580014br.gov.bcb.pix0136xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx5204000053039865402R$5.005802BR5913Agenda Inteligente6009Sao Paulo62280532123456789012345678901234630440D4'
    
    return {
      ok: true,
      qrCode,
      amount: amount || 0,
      message: 'Pix QR Code gerado. Integração completa em fase 2.'
    }
  }

  // Generate dynamic QR via Gerencianet (Phase 2)
  async generateViaGerencianet(amount, orderId) {
    try {
      // TODO: Implement Gerencianet API
      // const response = await fetch('https://api.gerencianet.com.br/v1/qrcode', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     calendar: { expiration_date: ... },
      //     trinformation: { reference_label: 'Agenda ' + orderId },
      //     amount: { value: amount * 100 }
      //   })
      // })
      console.log(`[Gerencianet] Generating QR for R$${amount}`)
      return { ok: true, qrCode: 'gerencianet-stub', amount }
    } catch (error) {
      console.error('[Gerencianet Error]', error)
      return { ok: false, error: error.message }
    }
  }

  // Generate dynamic QR via Asaas (Phase 2)
  async generateViaAsaas(amount, orderId) {
    try {
      // TODO: Implement Asaas API
      // const response = await fetch('https://api.asaas.com/v3/pix/qrcode/static', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${this.apiKey}` },
      //   body: JSON.stringify({
      //     addressKey: process.env.ASAAS_PIX_KEY,
      //     amount
      //   })
      // })
      console.log(`[Asaas] Generating QR for R$${amount}`)
      return { ok: true, qrCode: 'asaas-stub', amount }
    } catch (error) {
      console.error('[Asaas Error]', error)
      return { ok: false, error: error.message }
    }
  }

  // Webhook handler for payment confirmation (Phase 2)
  async handlePaymentWebhook(webhookData) {
    console.log('[Pix Webhook] Payment confirmed:', webhookData)
    // Update appointment.pixPaid = true
    // Update FeeLedger.status = 'charged'
    return { ok: true }
  }
}

export default PixService
