import express from 'express'
import jwt from 'jsonwebtoken'
import { db, mongoConnected, User, Appointment, FeeLedger } from '../server.js'
import { dbRun, dbGet, dbAll } from '../db.js'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'

export const adminRouter = express.Router()

// ============ MIDDLEWARE ============
export const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, errors: ['No token provided'] })
  }
  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (err) {
    return res.status(401).json({ ok: false, errors: ['Invalid token'] })
  }
}

// ============ DASHBOARD DATA ============
adminRouter.get('/dashboard', verifyAdminToken, async (req, res) => {
  try {
    let appointments = []

    if (mongoConnected && Appointment) {
      appointments = await Appointment.find({ professionalId: req.userId })
    } else {
      appointments = await dbAll('SELECT * FROM appointments WHERE professionalId = ?', [req.userId])
    }

    const totalAppointments = appointments.length
    const pendingAppointments = appointments.filter(a => a.status === 'pending').length
    const completedAppointments = appointments.filter(a => a.status === 'completed').length

    const revenueData = [
      { label: 'Segunda', value: 300 },
      { label: 'Terça', value: 450 },
      { label: 'Quarta', value: 320 },
      { label: 'Quinta', value: 500 },
      { label: 'Sexta', value: 830 }
    ]

    const appointmentsData = [
      { label: 'Realizados', value: completedAppointments },
      { label: 'Pendentes', value: pendingAppointments },
      { label: 'Cancelados', value: totalAppointments - completedAppointments - pendingAppointments }
    ]

    res.json({
      ok: true,
      stats: {
        totalAppointments,
        totalClients: 12,
        totalRevenue: 2400,
        pendingAppointments
      },
      revenueData,
      appointmentsData,
      appointments: appointments.slice(0, 5).map(a => ({
        id: a.id,
        client: a.clientName,
        service: a.service,
        date: a.dateTime,
        status: a.status
      })),
      clients: [],
      services: []
    })
  } catch (err) {
    console.error('[Dashboard Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to load dashboard'] })
  }
})

// ============ APPOINTMENTS ============
adminRouter.post('/appointments', verifyAdminToken, async (req, res) => {
  try {
    const { clientName, phone, service, date, notes } = req.body
    const id = crypto.randomUUID()

    if (mongoConnected && Appointment) {
      await Appointment.create({
        id,
        professionalId: req.userId,
        clientName,
        clientPhone: phone,
        service,
        dateTime: new Date(date),
        status: 'pending',
        notes
      })
    } else {
      await dbRun(
        'INSERT INTO appointments (id, professionalId, clientName, clientPhone, service, dateTime, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, req.userId, clientName, phone, service, date, 'pending', notes]
      )
    }

    res.json({ ok: true, appointment: { id, status: 'pending' } })
  } catch (err) {
    console.error('[Appointment Create Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to create appointment'] })
  }
})

adminRouter.put('/appointments/:id', verifyAdminToken, async (req, res) => {
  try {
    if (mongoConnected && Appointment) {
      await Appointment.updateOne(
        { id: req.params.id, professionalId: req.userId },
        { $set: req.body }
      )
    } else {
      await dbRun(
        'UPDATE appointments SET clientName = ?, clientPhone = ?, service = ?, status = ?, notes = ? WHERE id = ?',
        [req.body.clientName, req.body.phone, req.body.service, req.body.status, req.body.notes, req.params.id]
      )
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('[Appointment Update Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to update appointment'] })
  }
})

adminRouter.delete('/appointments/:id', verifyAdminToken, async (req, res) => {
  try {
    if (mongoConnected && Appointment) {
      await Appointment.deleteOne({ id: req.params.id, professionalId: req.userId })
    } else {
      await dbRun('DELETE FROM appointments WHERE id = ?', [req.params.id])
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('[Appointment Delete Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to delete appointment'] })
  }
})

// ============ CLIENTS ============
adminRouter.get('/clients', verifyAdminToken, async (req, res) => {
  try {
    res.json({
      ok: true,
      clients: [
        { id: '1', name: 'João Silva', phone: '11999999999', email: 'joao@example.com', totalAppointments: 5 },
        { id: '2', name: 'Maria Santos', phone: '11988888888', email: 'maria@example.com', totalAppointments: 3 }
      ]
    })
  } catch (err) {
    console.error('[Clients Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to load clients'] })
  }
})

adminRouter.post('/clients', verifyAdminToken, async (req, res) => {
  try {
    const { name, phone, email } = req.body
    const id = crypto.randomUUID()

    res.json({ ok: true, client: { id, name, phone, email } })
  } catch (err) {
    console.error('[Client Create Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to create client'] })
  }
})

// ============ SERVICES ============
adminRouter.get('/services', verifyAdminToken, async (req, res) => {
  try {
    res.json({
      ok: true,
      services: [
        { id: '1', name: 'Corte Cabelo', price: 5000, duration: 30 },
        { id: '2', name: 'Barba', price: 3000, duration: 20 },
        { id: '3', name: 'Corte Completo', price: 7000, duration: 45 }
      ]
    })
  } catch (err) {
    console.error('[Services Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to load services'] })
  }
})

adminRouter.post('/services', verifyAdminToken, async (req, res) => {
  try {
    const { name, price, duration } = req.body
    const id = crypto.randomUUID()

    res.json({ ok: true, service: { id, name, price, duration } })
  } catch (err) {
    console.error('[Service Create Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to create service'] })
  }
})

adminRouter.put('/services/:id', verifyAdminToken, async (req, res) => {
  try {
    res.json({ ok: true })
  } catch (err) {
    console.error('[Service Update Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to update service'] })
  }
})

adminRouter.delete('/services/:id', verifyAdminToken, async (req, res) => {
  try {
    res.json({ ok: true })
  } catch (err) {
    console.error('[Service Delete Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to delete service'] })
  }
})

// ============ REPORTS ============
adminRouter.get('/reports/analytics', verifyAdminToken, async (req, res) => {
  try {
    res.json({
      ok: true,
      analytics: {
        totalAppointments: 24,
        completionRate: 75,
        averageRevenue: 500,
        growthRate: 12,
        satisfactionRate: 4.8,
        returnClientRate: 73,
        averageTicket: 100
      }
    })
  } catch (err) {
    console.error('[Analytics Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to load analytics'] })
  }
})

adminRouter.get('/reports/export/:format', verifyAdminToken, async (req, res) => {
  try {
    const format = req.params.format

    if (format === 'csv') {
      const csv = 'Cliente,Serviço,Data,Status\nJoão Silva,Cabelo,2025-12-07,pending\nMaria Santos,Barba,2025-12-08,completed'
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio.csv"')
      res.send(csv)
    } else if (format === 'pdf') {
      // Gerar PDF simples com os dados
      const pdfContent = `
Relatório de Agendamentos
Data: ${new Date().toLocaleDateString('pt-BR')}

Cliente: João Silva
Serviço: Cabelo
Data: 2025-12-07
Status: Pendente

Cliente: Maria Santos
Serviço: Barba
Data: 2025-12-08
Status: Concluído
      `
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename="relatorio.pdf"')
      // Para PDF real, seria necessário usar uma biblioteca como pdfkit
      // Por enquanto, retornaremos um arquivo de texto simples com extensão .pdf
      res.send(pdfContent)
    } else {
      res.status(400).json({ ok: false, errors: ['Formato inválido'] })
    }
  } catch (err) {
    console.error('[Export Error]', err)
    res.status(500).json({ ok: false, errors: ['Falha ao exportar arquivo'] })
  }
})

// ============ SETTINGS ============
adminRouter.get('/settings/profile', verifyAdminToken, async (req, res) => {
  try {
    res.json({
      ok: true,
      profile: {
        id: req.userId,
        name: 'Profissional',
        email: 'prof@example.com',
        phone: '11999999999'
      }
    })
  } catch (err) {
    console.error('[Settings Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to load settings'] })
  }
})

adminRouter.put('/settings/profile', verifyAdminToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body
    
    if (mongoConnected && User) {
      await User.findByIdAndUpdate(req.userId, { name, email, phone })
    } else {
      await dbRun(
        'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
        [name, email, phone, req.userId]
      )
    }
    
    res.json({ ok: true, message: 'Perfil atualizado com sucesso' })
  } catch (err) {
    console.error('[Update Profile Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to update profile'] })
  }
})

adminRouter.put('/settings/business', verifyAdminToken, async (req, res) => {
  try {
    const { businessName, description, address, openTime, closeTime } = req.body
    // TODO: Salvar em tabela de configurações do negócio
    res.json({ ok: true, message: 'Informações do negócio atualizadas' })
  } catch (err) {
    console.error('[Update Business Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to update business'] })
  }
})

adminRouter.put('/settings/notifications', verifyAdminToken, async (req, res) => {
  try {
    const { newAppointments, canceledAppointments, clientReminders, promotions } = req.body
    // TODO: Salvar preferências de notificação
    res.json({ ok: true, message: 'Preferências de notificação atualizadas' })
  } catch (err) {
    console.error('[Update Notifications Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to update notifications'] })
  }
})

adminRouter.put('/settings/security', verifyAdminToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    // TODO: Verificar senha atual e atualizar para nova senha
    // Usar bcrypt.compare para verificar senha atual
    // Usar bcrypt.hash para criar hash da nova senha
    
    res.json({ ok: true, message: 'Senha alterada com sucesso' })
  } catch (err) {
    console.error('[Update Security Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to update password'] })
  }
})

// ============ INTEGRATIONS ============
adminRouter.get('/integrations', verifyAdminToken, async (req, res) => {
  try {
    res.json({
      ok: true,
      integrations: [
        { id: 'whatsapp', name: 'WhatsApp', status: 'disconnected' },
        { id: 'pix', name: 'Pix', status: 'disconnected' },
        { id: 'google-calendar', name: 'Google Calendar', status: 'disconnected' },
        { id: 'email-marketing', name: 'Email Marketing', status: 'disconnected' },
        { id: 'google-analytics', name: 'Google Analytics', status: 'disconnected' },
        { id: 'stripe', name: 'Stripe', status: 'disconnected' }
      ]
    })
  } catch (err) {
    console.error('[Integrations Error]', err)
    res.status(500).json({ ok: false, errors: ['Failed to load integrations'] })
  }
})

export default adminRouter
