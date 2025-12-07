import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { DataSource } from 'typeorm'
import Redis from 'ioredis'
import * as Sentry from '@sentry/node'
import Joi from 'joi'
import { OAuth2Client } from 'google-auth-library'
import { User } from './entities/User.js'
import { Appointment } from './entities/Appointment.js'

dotenv.config()

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const app = express()
app.use(cors())
app.use(express.json())

// Monitoring (Sentry)
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN })
  app.use(Sentry.Handlers.requestHandler())
}

// Database (PostgreSQL via TypeORM)
const dbUrl = process.env.DATABASE_URL || 'postgresql://app:app@localhost:5432/agenda'
export const AppDataSource = new DataSource({ 
  type: 'postgres', 
  url: dbUrl,
  entities: [User, Appointment],
  synchronize: true // Only for dev; disable in production
})

// Redis (optional). If REDIS_URL is not set, skip client initialization.
const redisUrl = process.env.REDIS_URL
export const redis = redisUrl ? new Redis(redisUrl) : null

app.get('/health', async (_req, res) => {
  try {
    if (redis) {
      await redis.ping()
    }
    res.json({ status: 'ok' })
  } catch (e) {
    if (process.env.SENTRY_DSN) Sentry.captureException(e)
    res.status(500).json({ status: 'error', error: String(e) })
  }
})

// Signup validation route
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(80).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional(),
  password: Joi.string().min(8).max(128).required(),
}).custom((value, helpers) => {
  if (!value.email && !value.phone) {
    return helpers.error('any.custom', { message: 'email_or_phone_required' })
  }
  return value
}, 'email or phone requirement')

app.post('/signup', (req, res) => {
  const { error, value } = signupSchema.validate(req.body, { abortEarly: false })
  if (error) {
    const details = error.details.map(d => d.type === 'any.custom' ? 'email_or_phone_required' : d.message)
    return res.status(400).json({ ok: false, errors: details })
  }
  // Placeholder: do not persist yet (Phase 1). Return sanitized payload.
  const { password, ...safe } = value
  return res.json({ ok: true, user: safe })
})

// Google OAuth signup/login
app.post('/auth/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) {
      return res.status(400).json({ ok: false, errors: ['Credential is required'] })
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()
    
    if (!payload || !payload.email) {
      return res.status(400).json({ ok: false, errors: ['Invalid Google token'] })
    }

    // Placeholder: In production, check if user exists, create if not, return JWT
    const userData = {
      email: payload.email,
      name: payload.name || '',
      googleId: payload.sub,
      plan: 'free'
    }

    return res.json({ ok: true, user: userData })
  } catch (error) {
    console.error('[Google Auth Error]', error)
    if (process.env.SENTRY_DSN) Sentry.captureException(error)
    return res.status(500).json({ ok: false, errors: ['Failed to authenticate with Google'] })
  }
})

// Middleware: check user plan
const requirePlan = (...plans) => (req, res, next) => {
  const userPlan = req.headers['x-user-plan'] || 'free'
  if (!plans.includes(userPlan)) {
    return res.status(403).json({ ok: false, error: 'upgrade_required', requiredPlans: plans })
  }
  next()
}

// POST /appointments - create appointment with WhatsApp confirmation (Essencial+)
const appointmentSchema = Joi.object({
  clientName: Joi.string().min(2).required(),
  clientPhone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional(),
  service: Joi.string().required(),
  dateTime: Joi.date().iso().required()
})

app.post('/appointments', requirePlan('essencial', 'premium'), (req, res) => {
  const { error, value } = appointmentSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ ok: false, errors: error.details.map(d => d.message) })
  }
  // Placeholder: persist appointment and trigger WhatsApp confirmation
  const whatsappProvider = process.env.WHATSAPP_PROVIDER || 'twilio'
  const whatsappKey = process.env.WHATSAPP_API_KEY
  if (whatsappKey) {
    // TODO: integrate with Twilio/Z-API to send confirmation
    console.log(`[WhatsApp] Sending confirmation via ${whatsappProvider} to ${value.clientPhone}`)
  }
  return res.json({ ok: true, appointment: { ...value, id: 'temp-id', status: 'pending', whatsappSent: !!whatsappKey } })
})

// POST /pix/generate - generate static QR code (Premium)
const pixSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().optional()
})

app.post('/pix/generate', requirePlan('premium'), (req, res) => {
  const { error, value } = pixSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ ok: false, errors: error.details.map(d => d.message) })
  }
  // Placeholder: integrate with Gerencianet/Asaas to generate dynamic QR
  const pixProvider = process.env.PIX_PROVIDER || 'gerencianet'
  const pixKey = process.env.PIX_API_KEY
  const qrCodeStatic = `00020126580014BR.GOV.BCB.PIX0136${process.env.PIX_STATIC_KEY || 'your-pix-key'}520400005303986540${value.amount.toFixed(2)}5802BR5913AgendaApp6009SaoPaulo62070503***6304XXXX`
  if (pixKey) {
    console.log(`[Pix] Generating QR via ${pixProvider} for amount ${value.amount}`)
  }
  return res.json({ ok: true, qrCode: qrCodeStatic, amount: value.amount, provider: pixProvider })
})

const port = process.env.PORT || 3001
const server = app.listen(port, () => console.log(`Backend listening on ${port}`))

AppDataSource.initialize().then(() => {
  console.log('DB initialized')
}).catch(err => {
  console.error('DB init error', err)
})

// Sentry error handler (after routes)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler())
}
