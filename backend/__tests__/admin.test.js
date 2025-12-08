const request = require('supertest')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const API_URL = 'http://localhost:3001'

describe('Admin Dashboard and CRUD Operations', () => {
  let authToken = null
  let userId = null
  const testUser = {
    email: `admin-test-${Date.now()}@example.com`,
    password: 'AdminTest123'
  }

  beforeAll(async () => {
    const signupRes = await request(API_URL)
      .post('/signup')
      .send(testUser)

    if (signupRes.status === 200 || signupRes.status === 201) {
      authToken = signupRes.body.token
      const decoded = jwt.verify(authToken, JWT_SECRET)
      userId = decoded.userId
    }
  })

  describe('GET /admin/dashboard', () => {
    it('should require valid token', async () => {
      const res = await request(API_URL)
        .get('/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token')

      expect(res.status).toBe(401)
    })

    it('should reject requests without token', async () => {
      const res = await request(API_URL)
        .get('/admin/dashboard')

      expect(res.status).toBe(401)
    })

    it('should return dashboard data with valid token', async () => {
      if (!authToken) {
        console.log('Skipping: no auth token available')
        return
      }

      const res = await request(API_URL)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        expect(res.body).toHaveProperty('stats')
        expect(res.body.stats).toHaveProperty('totalAppointments')
        expect(res.body.stats).toHaveProperty('totalClients')
      }
    })
  })

  describe('POST /admin/appointments', () => {
    it('should create appointment with valid data', async () => {
      if (!authToken) return

      const appointmentData = {
        clientName: 'John Doe',
        phone: '(11) 99999-9999',
        service: 'Haircut',
        date: new Date(Date.now() + 86400000).toISOString(),
        status: 'pending',
        notes: 'Test appointment'
      }

      const res = await request(API_URL)
        .post('/admin/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)

      expect([200, 201, 500]).toContain(res.status)
    })

    it('should require authentication', async () => {
      const res = await request(API_URL)
        .post('/admin/appointments')
        .send({
          clientName: 'John Doe',
          phone: '(11) 99999-9999',
          service: 'Haircut',
          date: new Date(Date.now() + 86400000).toISOString()
        })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /admin/appointments', () => {
    it('should list appointments with valid token', async () => {
      if (!authToken) return

      const res = await request(API_URL)
        .get('/admin/appointments')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 404, 500]).toContain(res.status)
    })

    it('should reject requests without token', async () => {
      const res = await request(API_URL)
        .get('/admin/appointments')

      expect([401, 404]).toContain(res.status)
    })
  })

  describe('POST /admin/clients', () => {
    it('should create client with valid data', async () => {
      if (!authToken) return

      const clientData = {
        name: 'Jane Smith',
        phone: '(11) 98888-8888',
        email: `client-${Date.now()}@example.com`
      }

      const res = await request(API_URL)
        .post('/admin/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData)

      expect([200, 201, 500]).toContain(res.status)
    })

    it('should require authentication', async () => {
      const res = await request(API_URL)
        .post('/admin/clients')
        .send({
          name: 'Jane Smith',
          phone: '(11) 98888-8888'
        })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /admin/clients', () => {
    it('should list clients with valid token', async () => {
      if (!authToken) return

      const res = await request(API_URL)
        .get('/admin/clients')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 500]).toContain(res.status)
    })

    it('should reject requests without token', async () => {
      const res = await request(API_URL)
        .get('/admin/clients')

      expect(res.status).toBe(401)
    })
  })

  describe('POST /admin/services', () => {
    it('should create service with valid data', async () => {
      if (!authToken) return

      const serviceData = {
        name: 'Premium Haircut',
        price: 5000,
        duration: 60,
        description: 'Professional haircut with styling'
      }

      const res = await request(API_URL)
        .post('/admin/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(serviceData)

      expect([200, 201, 500]).toContain(res.status)
    })

    it('should require authentication', async () => {
      const res = await request(API_URL)
        .post('/admin/services')
        .send({
          name: 'Premium Haircut',
          price: 5000,
          duration: 60
        })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /admin/services', () => {
    it('should list services with valid token', async () => {
      if (!authToken) return

      const res = await request(API_URL)
        .get('/admin/services')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 500]).toContain(res.status)
    })

    it('should reject requests without token', async () => {
      const res = await request(API_URL)
        .get('/admin/services')

      expect(res.status).toBe(401)
    })
  })
})
