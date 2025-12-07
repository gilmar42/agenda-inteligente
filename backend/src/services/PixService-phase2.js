// Versão estendida de PixService com suporte a QR dinâmico
// backend/src/services/PixService.js

import fetch from 'node-fetch'
import crypto from 'crypto'

export class PixService {
  constructor(provider = 'gerencianet', apiKey = null) {
    this.provider = provider
    this.apiKey = apiKey
  }

  // ============ MVP: QR Code Estático ============
  async generateStaticQRCode(amount = null) {
    const qrCode = '00020126580014br.gov.bcb.pix0136xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx5204000053039865402R$5.005802BR5913Agenda Inteligente6009Sao Paulo62280532123456789012345678901234630440D4'
    
    return {
      ok: true,
      qrCode,
      amount: amount || 0,
      type: 'static',
      message: 'Pix QR Code estático (MVP). Upgrade para dinâmico em Fase 2.'
    }
  }

  // ============ FASE 2: QR Code Dinâmico ============

  async generateDynamic(amount, orderId, expirationHours = 24) {
    if (this.provider === 'gerencianet') {
      return this.generateViaGerencianet(amount, orderId, expirationHours)
    } else if (this.provider === 'asaas') {
      return this.generateViaAsaas(amount, orderId, expirationHours)
    }
    throw new Error('Invalid Pix provider')
  }

  // Gerencianet - Mais completo, com webhook automático
  async generateViaGerencianet(amount, orderId, expirationHours = 24) {
    try {
      // Autenticação OAuth2 (simplificado - em produção, cachear token)
      const authResponse = await fetch('https://api.gerencianet.com.br/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${process.env.GERENCIANET_CLIENT_ID}&client_secret=${process.env.GERENCIANET_CLIENT_SECRET}`
      })
      
      const authData = await authResponse.json()
      const token = authData.access_token

      // Gerar QR Code
      const expirationDate = new Date(Date.now() + expirationHours * 60 * 60 * 1000)
      
      const qrResponse = await fetch('https://api.gerencianet.com.br/v1/qrcode', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          calendar: {
            // Expiração em X horas
            expiration_date: expirationDate.toISOString().split('T')[0]
          },
          trinformation: {
            reference_label: `AGD-${orderId.slice(0, 8).toUpperCase()}`
          },
          amount: {
            // Gerencianet espera centavos
            value: Math.round(amount * 100)
          }
        })
      })

      const qrData = await qrResponse.json()

      if (!qrResponse.ok) {
        throw new Error(`Gerencianet error: ${qrData.message}`)
      }

      return {
        ok: true,
        qrCode: qrData.qrcode, // URL imagem ou string EMV
        brcode: qrData.brcode, // Código para leitura automática
        txid: qrData.txid,
        expiresAt: expirationDate.toISOString(),
        type: 'dynamic',
        provider: 'gerencianet'
      }
    } catch (error) {
      console.error('[Gerencianet Pix Error]', error)
      throw error
    }
  }

  // Asaas - Mais simples, mas pode exigir chave Pix registrada
  async generateViaAsaas(amount, orderId, expirationHours = 24) {
    try {
      const expirationDate = new Date(Date.now() + expirationHours * 60 * 60 * 1000)

      const qrResponse = await fetch('https://api.asaas.com/v3/pix/qrcode/static', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ASAAS_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addressKey: process.env.ASAAS_PIX_KEY, // Chave Pix registrada
          amount: amount,
          description: `Agendamento ${orderId}`
        })
      })

      const qrData = await qrResponse.json()

      if (!qrResponse.ok) {
        throw new Error(`Asaas error: ${qrData.errors[0].description}`)
      }

      return {
        ok: true,
        qrCode: qrData.encodedImage, // Base64
        brcode: qrData.payload,
        txid: qrData.id,
        expiresAt: expirationDate.toISOString(),
        type: 'dynamic',
        provider: 'asaas'
      }
    } catch (error) {
      console.error('[Asaas Pix Error]', error)
      throw error
    }
  }

  // ============ WEBHOOK VERIFICATION ============

  // Validar assinatura Gerencianet
  verifyGerencianetSignature(req) {
    const signature = req.headers['x-gerencianet-signature']
    if (!signature) return false

    const body = JSON.stringify(req.body)
    const hash = crypto
      .createHmac('sha256', process.env.GERENCIANET_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    return hash === signature
  }

  // Validar assinatura Asaas
  verifyAsaasSignature(req) {
    const signature = req.headers['asaas-webhook-signature']
    if (!signature) return false

    const body = req.rawBody // Usar body raw, não parsed
    const hash = crypto
      .createHmac('sha256', process.env.ASAAS_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    return hash === signature
  }

  // ============ PAYMENT CONFIRMATION ============

  async handlePaymentConfirmation(eventData) {
    console.log('[Pix] Payment confirmed:', eventData)
    // Retorna dados para backend processar:
    // - txid para buscar transação
    // - amount para validar
    // - status ('confirmed' ou 'pending')

    return {
      txid: eventData.brcode || eventData.id,
      amount: eventData.amount,
      status: 'confirmed',
      confirmedAt: new Date()
    }
  }

  // ============ UTILITIES ============

  // Validar se QR expirou
  isExpired(expiresAt) {
    return new Date(expiresAt) < new Date()
  }

  // Gerar TXID único (36 caracteres max para Pix)
  generateTxid() {
    return crypto.randomBytes(18).toString('hex')
  }
}

export default PixService
