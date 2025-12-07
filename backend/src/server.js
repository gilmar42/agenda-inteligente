import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import Joi from 'joi'
import { OAuth2Client } from 'google-auth-library'
import { adminRouter } from './routes/adminRouter.js'
import { initDB, dbRun, dbGet, dbAll, getDB } from './db.js'
import crypto from 'crypto'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/agenda_inteligente'
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const app = express()
app.use(cors())
app.use(express.json())

// ============ DATABASE CONFIG ============

let mongoConnected = false
let User, Appointment, FeeLedger

// Initialize databases
mongoose.connect(MONGO_URL, {
  serverSelectionTimeoutMS: 5000,
}).then(() => {
  console.log('✅ MongoDB connected')
  mongoConnected = true
  
  const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    passwordHash: String,
    plan: { type: String, default: 'free' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  const appointmentSchema = new mongoose.Schema({
    id: String,
    professionalId: String,
    clientName: String,
    clientPhone: String,
    service: String,
    dateTime: Date,
    status: { type: String, default: 'pending' },
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  })

  const feeLedgerSchema = new mongoose.Schema({
    id: String,
    userId: String,
    amount: Number,
    description: String,
    createdAt: { type: Date, default: Date.now }
  })

  User = mongoose.model('User', userSchema)
  Appointment = mongoose.model('Appointment', appointmentSchema)
  FeeLedger = mongoose.model('FeeLedger', feeLedgerSchema)
}).catch((err) => {
  console.warn('⚠️  MongoDB not available, using SQLite3 for development')
  console.warn('   Error:', err.message)
})

// Initialize SQLite3
await initDB()

// Export for use in routes
export { getDB as db, mongoConnected, User, Appointment, FeeLedger }

// ============ MIDDLEWARE ============

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Missing or invalid token' })
  }
  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.userPlan = decoded.plan
    next()
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'Invalid token' })
  }
}

const requirePlan = (...plans) => (req, res, next) => {
  const userPlan = req.userPlan || 'free'
  if (!plans.includes(userPlan)) {
    return res.status(403).json({ ok: false, error: 'upgrade_required', requiredPlans: plans })
  }
  next()
}

// ============ ROUTES ============

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoConnected ? 'connected' : 'disconnected',
    sqlite3: 'ok'
  })
})

// ============ SIGNUP ============
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(80).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional(),
  password: Joi.string().min(8).max(128).required()
}).custom((value, helpers) => {
  if (!value.email && !value.phone) {
    return helpers.error('any.custom', { message: 'email_or_phone_required' })
  }
  return value
}, 'email or phone requirement')

app.post('/signup', async (req, res) => {
  const { error, value } = signupSchema.validate(req.body, { abortEarly: false })
  if (error) {
    const details = error.details.map(d => d.type === 'any.custom' ? 'email_or_phone_required' : d.message)
    return res.status(400).json({ ok: false, errors: details })
  }

  try {
    const id = crypto.randomUUID()
    const passwordHash = await bcrypt.hash(value.password, 10)

    if (mongoConnected && User) {
      const existingEmail = await User.findOne({ email: value.email })
      const existingPhone = await User.findOne({ phone: value.phone })
      
      if (existingEmail || existingPhone) {
        return res.status(400).json({ ok: false, errors: ['Email or phone already registered'] })
      }

      const user = await User.create({
        id,
        name: value.name || null,
        email: value.email || null,
        phone: value.phone || null,
        passwordHash,
        plan: 'free'
      })

      const token = jwt.sign({ userId: user.id, plan: user.plan }, JWT_SECRET, { expiresIn: '7d' })
      return res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name }, token })
    } else {
      try {
        await dbRun(
          'INSERT INTO users (id, name, email, phone, passwordHash, plan) VALUES (?, ?, ?, ?, ?, ?)',
          [id, value.name || null, value.email || null, value.phone || null, passwordHash, 'free']
        )

        const token = jwt.sign({ userId: id, plan: 'free' }, JWT_SECRET, { expiresIn: '7d' })
        return res.json({
          ok: true,
          user: { id, email: value.email, name: value.name },
          token
        })
      } catch (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ ok: false, errors: ['Email or phone already registered'] })
        }
        throw err
      }
    }
  } catch (err) {
    console.error('[Signup Error]', err)
    return res.status(500).json({ ok: false, errors: ['Signup failed'] })
  }
})

// ============ LOGIN ============
const loginSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional(),
  password: Joi.string().required()
}).custom((value, helpers) => {
  if (!value.email && !value.phone) {
    return helpers.error('any.custom', { message: 'email_or_phone_required' })
  }
  return value
}, 'email or phone requirement')

app.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body)
  if (error) {
    return res.status(400).json({ ok: false, errors: [error.message] })
  }

  try {
    let user = null

    if (mongoConnected && User) {
      user = await User.findOne({
        $or: [{ email: value.email }, { phone: value.phone }]
      })
    } else {
      user = await dbGet(
        value.email
          ? 'SELECT * FROM users WHERE email = ?'
          : 'SELECT * FROM users WHERE phone = ?',
        [value.email || value.phone]
      )
    }

    if (!user) {
      return res.status(401).json({ ok: false, errors: ['Invalid credentials'] })
    }

    const passwordMatch = await bcrypt.compare(value.password, user.passwordHash)
    if (!passwordMatch) {
      return res.status(401).json({ ok: false, errors: ['Invalid credentials'] })
    }

    const token = jwt.sign({ userId: user.id, plan: user.plan }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
      token
    })
  } catch (err) {
    console.error('[Login Error]', err)
    return res.status(500).json({ ok: false, errors: ['Login failed'] })
  }
})

// ============ GOOGLE AUTH ============
app.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID })
    const { sub, name, email } = ticket.getPayload()

    let user = null
    const userId = crypto.randomUUID()
    const tempPassword = crypto.randomUUID()
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    if (mongoConnected && User) {
      user = await User.findOne({ email })
      if (!user) {
        user = await User.create({ id: userId, name, email, passwordHash, plan: 'free' })
      }
    } else {
      user = await dbGet('SELECT * FROM users WHERE email = ?', [email])
      if (!user) {
        await dbRun(
          'INSERT INTO users (id, name, email, passwordHash, plan) VALUES (?, ?, ?, ?, ?)',
          [userId, name, email, passwordHash, 'free']
        )
        user = { id: userId, name, email, plan: 'free' }
      }
    }

    const jwtToken = jwt.sign({ userId: user.id, plan: user.plan }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name }, token: jwtToken })
  } catch (err) {
    console.error('[Google Auth Error]', err)
    return res.status(500).json({ ok: false, errors: ['Google auth failed'] })
  }
})

// ============ APPOINTMENTS ============
app.post('/appointments', verifyToken, async (req, res) => {
  try {
    const { clientName, clientPhone, service, dateTime, notes } = req.body
    const id = crypto.randomUUID()

    if (mongoConnected && Appointment) {
      await Appointment.create({
        id,
        professionalId: req.userId,
        clientName,
        clientPhone,
        service,
        dateTime,
        status: 'pending',
        notes
      })
    } else {
      await dbRun(
        'INSERT INTO appointments (id, professionalId, clientName, clientPhone, service, dateTime, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, req.userId, clientName, clientPhone, service, dateTime, 'pending', notes]
      )
    }

    res.json({ ok: true, id })
  } catch (err) {
    console.error('[Create Appointment Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to create appointment'] })
  }
})

app.get('/appointments', verifyToken, async (req, res) => {
  try {
    let appointments = []

    if (mongoConnected && Appointment) {
      appointments = await Appointment.find({ professionalId: req.userId })
    } else {
      appointments = await dbAll(
        'SELECT * FROM appointments WHERE professionalId = ? ORDER BY dateTime DESC',
        [req.userId]
      )
    }

    res.json({ ok: true, appointments })
  } catch (err) {
    console.error('[Get Appointments Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to fetch appointments'] })
  }
})

// ============ PIX PAYMENT ============
app.post('/payments/pix', verifyToken, async (req, res) => {
  try {
    const qrCodeEMV = '00020126580014br.gov.bcb.pix0136xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx5204000053039865402R$5.005802BR5913Agenda Inteligente6009Sao Paulo62280532123456789012345678901234630440D4'

    return res.json({
      ok: true,
      qrCode: qrCodeEMV,
      message: 'QR Code gerado com sucesso'
    })
  } catch (err) {
    console.error('[PIX Payment Error]', err)
    return res.status(500).json({ ok: false, errors: ['Failed to generate QR code'] })
  }
})

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoConnected ? 'mongodb' : 'sqlite',
    environment: process.env.NODE_ENV || 'development'
  }
  res.status(200).json(health)
})

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'API is running'
  })
})

// ============ ADMIN ROUTES ============
app.use('/admin', adminRouter)

// ============ SAAS ROUTES ============
import saasRouter from '../routes/saas.js'
import superadminRouter from '../routes/superadmin.js'
app.use('/api/saas', saasRouter)
app.use('/api/superadmin', superadminRouter)

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Uncaught error:', err)
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({ 
    ok: false, 
    errors: [err.message || 'Internal server error'],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// ============ START SERVER ============
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on http://localhost:${PORT}`)
  console.log(`📱 Frontend: http://localhost:5173`)
  console.log(`📊 Database: ${mongoConnected ? 'MongoDB' : 'SQLite3'}`)
})
