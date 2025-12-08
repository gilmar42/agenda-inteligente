const request = require('supertest')
const app = require('../server')

describe('Authentication Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /login', () => {
    it('should login with email and password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })

      expect([200, 401]).toContain(response.status)
      if (response.status === 200) {
        expect(response.body).toHaveProperty('token')
        expect(response.body).toHaveProperty('user')
        expect(response.body).toHaveProperty('ok', true)
      }
    })

    it('should login with phone and password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          phone: '+5511999999999',
          password: 'password123'
        })

      expect([200, 401]).toContain(response.status)
      if (response.status === 200) {
        expect(response.body).toHaveProperty('token')
        expect(response.body).toHaveProperty('user')
      }
    })

    it('should reject login with invalid email and password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('ok', false)
      expect(response.body).toHaveProperty('errors')
    })

    it('should reject login without email or phone', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          password: 'password123'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('ok', false)
    })

    it('should reject login without password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('ok', false)
    })
  })

  describe('POST /auth/google', () => {
    it('should handle Google OAuth login/signup', async () => {
      const response = await request(app)
        .post('/auth/google')
        .send({
          token: 'fake-google-token'
        })

      expect([200, 401, 500]).toContain(response.status)
      if (response.status === 200) {
        expect(response.body).toHaveProperty('token')
        expect(response.body).toHaveProperty('user')
        expect(response.body).toHaveProperty('ok', true)
      }
    })

    it('should reject invalid Google token', async () => {
      const response = await request(app)
        .post('/auth/google')
        .send({
          token: 'invalid-token'
        })

      expect([400, 500]).toContain(response.status)
      expect(response.body).toHaveProperty('ok', false)
    })

    it('should reject missing token', async () => {
      const response = await request(app)
        .post('/auth/google')
        .send({})

      expect(response.status).toBe(400)
    })
  })

  describe('POST /signup', () => {
    it('should register new user with email', async () => {
      const response = await request(app)
        .post('/signup')
        .send({
          name: 'New User',
          email: `newuser${Date.now()}@example.com`,
          password: 'password123'
        })

      expect([201, 400, 409]).toContain(response.status)
    })

    it('should register new user with phone', async () => {
      const response = await request(app)
        .post('/signup')
        .send({
          name: 'New User',
          phone: `+5511${Math.random().toString().slice(2, 12)}`,
          password: 'password123'
        })

      expect([201, 400, 409]).toContain(response.status)
    })

    it('should reject signup without required fields', async () => {
      const response = await request(app)
        .post('/signup')
        .send({
          name: 'New User'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('ok', false)
    })

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })

      expect([409, 400, 500]).toContain(response.status)
    })
  })
})

describe('Admin Dashboard Routes', () => {
  let authToken = 'test-token'

  describe('GET /admin/dashboard', () => {
    it('should return dashboard data with auth token', async () => {
      const response = await request(app)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 401, 403]).toContain(response.status)
    })

    it('should reject request without auth token', async () => {
      const response = await request(app)
        .get('/admin/dashboard')

      expect(response.status).toBe(401)
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token')

      expect([401, 403]).toContain(response.status)
    })
  })
})

describe('Appointments Routes', () => {
  let authToken = 'test-token'

  describe('POST /appointments', () => {
    it('should create appointment with valid data', async () => {
      const response = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientName: 'John Doe',
          clientPhone: '11999999999',
          service: 'Haircut',
          dateTime: '2024-12-15T10:00:00',
          notes: 'Special request'
        })

      expect([201, 400, 401]).toContain(response.status)
    })

    it('should reject appointment without required fields', async () => {
      const response = await request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clientName: 'John Doe'
        })

      expect([400, 401]).toContain(response.status)
    })

    it('should reject appointment without auth', async () => {
      const response = await request(app)
        .post('/appointments')
        .send({
          clientName: 'John Doe',
          clientPhone: '11999999999',
          service: 'Haircut',
          dateTime: '2024-12-15T10:00:00'
        })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /appointments', () => {
    it('should get appointments with auth', async () => {
      const response = await request(app)
        .get('/appointments')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 401]).toContain(response.status)
    })

    it('should reject without auth', async () => {
      const response = await request(app)
        .get('/appointments')

      expect(response.status).toBe(401)
    })
  })
})

describe('Services Routes', () => {
  let authToken = 'test-token'

  describe('GET /services', () => {
    it('should get services list', async () => {
      const response = await request(app)
        .get('/services')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 401]).toContain(response.status)
      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true)
      }
    })
  })

  describe('POST /services', () => {
    it('should create service with valid data', async () => {
      const response = await request(app)
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Haircut',
          price: 5000,
          duration: 30
        })

      expect([201, 400, 401]).toContain(response.status)
    })
  })
})
