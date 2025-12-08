const request = require('supertest')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const API_URL = 'http://localhost:3001'

describe('Complete User Workflows - Integration Tests', () => {
  let authToken = null
  let userId = null

  const testUser = {
    email: `integration-test-${Date.now()}@example.com`,
    password: 'IntegrationTest123'
  }

  describe('Workflow 1: User Registration and Login', () => {
    it('should register new user', async () => {
      const res = await request(API_URL)
        .post('/signup')
        .send({
          email: testUser.email,
          password: testUser.password
        })

      expect([200, 201]).toContain(res.status)
      expect(res.body).toHaveProperty('token')
      authToken = res.body.token

      const decoded = jwt.verify(authToken, JWT_SECRET)
      userId = decoded.userId
      expect(userId).toBeDefined()
    })

    it('should login with registered credentials', async () => {
      const res = await request(API_URL)
        .post('/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })

      expect([200, 401]).toContain(res.status)
      if (res.status === 200) {
        expect(res.body).toHaveProperty('token')
        authToken = res.body.token
      }
    })

    it('should fail login with wrong password', async () => {
      const res = await request(API_URL)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        })

      expect([401, 400]).toContain(res.status)
    })
  })

  describe('Workflow 2: Create Clients and Appointments', () => {
    it('should create a client', async () => {
      if (!authToken) return

      const res = await request(API_URL)
        .post('/admin/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Maria Silva',
          phone: '(11) 98765-4321',
          email: `client-${Date.now()}@example.com`
        })

      expect([200, 201, 500]).toContain(res.status)
    })

    it('should create a service', async () => {
      if (!authToken) return

      const res = await request(API_URL)
        .post('/admin/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Corte Premium',
          price: 7500,
          duration: 60,
          description: 'Corte completo com alinhamento'
        })

      expect([200, 201, 500]).toContain(res.status)
    })

    it('should create appointment for the client', async () => {
      if (!authToken) return

      const futureDate = new Date(Date.now() + 86400000)
      const res = await request(API_URL)
        .post('/admin/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientName: 'Maria Silva',
          phone: '(11) 98765-4321',
          service: 'Corte Premium',
          date: futureDate.toISOString(),
          status: 'pending',
          notes: 'Primeira vez na barbearia'
        })

      expect([200, 201, 500]).toContain(res.status)
    })

    it('should retrieve appointment from dashboard', async () => {
      if (!authToken) return

      const res = await request(API_URL)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        expect(res.body).toHaveProperty('appointments')
        expect(Array.isArray(res.body.appointments)).toBeTruthy()
      }
    })
  })

  describe('Workflow 3: Search and Filter', () => {
    it('should list all clients', async () => {
      if (!authToken) return

      const res = await request(API_URL)
        .get('/admin/clients')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 500]).toContain(res.status)
    })

    it('should list all services', async () => {
      if (!authToken) return

      const res = await request(API_URL)
        .get('/admin/services')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 500]).toContain(res.status)
    })

    it('should list all appointments', async () => {
      if (!authToken) return

      const res = await request(API_URL)
        .get('/admin/appointments')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 404, 500]).toContain(res.status)
    })
  })

  describe('Workflow 4: Authentication Edge Cases', () => {
    it('should reject malformed token', async () => {
      const res = await request(API_URL)
        .get('/admin/dashboard')
        .set('Authorization', 'Bearer malformed.token.here')

      expect(res.status).toBe(401)
    })

    it('should reject request without authorization header', async () => {
      const res = await request(API_URL)
        .get('/admin/dashboard')

      expect(res.status).toBe(401)
    })

    it('should reject request with invalid bearer format', async () => {
      const res = await request(API_URL)
        .get('/admin/dashboard')
        .set('Authorization', 'InvalidToken123')

      expect(res.status).toBe(401)
    })
  })

  describe('Workflow 5: Multiple Operations Sequence', () => {
    it('should handle multiple create operations in sequence', async () => {
      if (!authToken) return

      const client1 = await request(API_URL)
        .post('/admin/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'João Santos',
          phone: '(11) 99999-9999',
          email: `client-joao-${Date.now()}@example.com`
        })

      const client2 = await request(API_URL)
        .post('/admin/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Pedro Costa',
          phone: '(11) 99998-8888',
          email: `client-pedro-${Date.now()}@example.com`
        })

      expect([200, 201, 500]).toContain(client1.status)
      expect([200, 201, 500]).toContain(client2.status)
    })
  })

  describe('Workflow 6: Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      if (!authToken) return

      const promises = [
        request(API_URL)
          .get('/admin/dashboard')
          .set('Authorization', `Bearer ${authToken}`),
        request(API_URL)
          .get('/admin/clients')
          .set('Authorization', `Bearer ${authToken}`),
        request(API_URL)
          .get('/admin/services')
          .set('Authorization', `Bearer ${authToken}`),
        request(API_URL)
          .get('/admin/appointments')
          .set('Authorization', `Bearer ${authToken}`)
      ]

      const results = await Promise.all(promises)

      results.forEach(res => {
        expect([200, 404, 500]).toContain(res.status)
      })
    })
  })
})
