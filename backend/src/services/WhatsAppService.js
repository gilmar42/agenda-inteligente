// WhatsApp service adapter
// Supports Twilio and Z-API

export class WhatsAppService {
  constructor(provider = 'twilio', apiKey = null) {
    this.provider = provider
    this.apiKey = apiKey
  }

  async sendConfirmation(to, appointmentData) {
    if (!this.apiKey) {
      console.log(`[WhatsApp Stub] Would send to ${to}: Appointment confirmed for ${appointmentData.service}`)
      return { ok: true, messageSid: 'stub-' + Date.now() }
    }

    if (this.provider === 'twilio') {
      return this.sendViaTwilio(to, appointmentData)
    } else if (this.provider === 'z-api') {
      return this.sendViaZAPI(to, appointmentData)
    }
  }

  async sendViaTwilio(to, appointmentData) {
    try {
      // TODO: Implement Twilio integration
      // const twilio = require('twilio')(accountSid, authToken)
      // const message = await twilio.messages.create({
      //   body: `Olá ${appointmentData.clientName}! Sua consulta foi agendada para ${appointmentData.dateTime}. Serviço: ${appointmentData.service}`,
      //   from: process.env.TWILIO_PHONE,
      //   to: to
      // })
      console.log(`[Twilio] Sending to ${to}: ${appointmentData.service}`)
      return { ok: true, messageSid: 'twilio-stub' }
    } catch (error) {
      console.error('[Twilio Error]', error)
      return { ok: false, error: error.message }
    }
  }

  async sendViaZAPI(to, appointmentData) {
    try {
      // TODO: Implement Z-API integration
      // const response = await fetch('https://api.z-api.io/instances/...', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'Client-Token': this.apiKey },
      //   body: JSON.stringify({
      //     phone: to,
      //     message: `Olá ${appointmentData.clientName}! Sua consulta foi agendada...`
      //   })
      // })
      console.log(`[Z-API] Sending to ${to}: ${appointmentData.service}`)
      return { ok: true, messageId: 'zapi-stub' }
    } catch (error) {
      console.error('[Z-API Error]', error)
      return { ok: false, error: error.message }
    }
  }

  async sendReminder(to, appointmentData) {
    const message = `Lembrete: Você tem um agendamento amanhã às ${appointmentData.dateTime} para ${appointmentData.service}`
    console.log(`[WhatsApp Reminder] Sending to ${to}: ${message}`)
    return { ok: true }
  }
}

export default WhatsAppService
