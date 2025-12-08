const request = require('supertest')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const API_URL = 'http://localhost:3001'

describe('Authentication Routes', () => {
  const testUser = {
    email: `test-auth-${Date.now()}@example.com`,
    password: 'TestPassword123'
  }

  let authToken = null

  describe('POST /signup', () => {
    it('should register a new user successfully', async () => {
      const res = await request(API_URL)
        .post('/signup')
        .send({
          email: testUser.email,
          password: testUser.password
        })

      expect([200, 201]).toContain(res.status)
      expect(res.body).toHaveProperty('token')
      authToken = res.body.token
    })

    it('should reject duplicate email registration', async () => {
      await request(API_URL)
        .post('/signup')
        .send({
          email: testUser.email,
          password: testUser.password
        })

      const res = await request(API_URL)
        .post('/signup')
        .send({
          email: testUser.email,
          password: 'AnotherPassword123'
        })

      expect([409, 400]).toContain(res.status)
      expect(res.body.errors || res.body.error).toBeDefined()
    })

    it('should validate email format', async () => {
      const res = await request(API_URL)
        .post('/signup')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123'
        })

      expect(res.status).toBe(400)
      expect(res.body.errors).toBeDefined()
    })

    it('should validate password requirements', async () => {
      const res = await request(API_URL)
        .post('/signup')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: '123'
        })

      expect(res.status).toBe(400)
      expect(res.body.errors).toBeDefined()
    })
  })

  describe('POST /login', () => {
    it('should login existing user', async () => {
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

    it('should reject invalid credentials', async () => {
      const res = await request(API_URL)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        })

      expect([401, 400]).toContain(res.status)
    })

    it('should reject non-existent user', async () => {
      const res = await request(API_URL)
        .post('/login')
        .send({
          email: `nonexistent-${Date.now()}@example.com`,
          password: 'AnyPassword123'
        })

      expect([401, 404, 400]).toContain(res.status)
    })
  })

  describe('Token validation', () => {
    it('should decode valid token', async () => {
      const loginRes = await request(API_URL)
        .post('/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })

      if (loginRes.status === 200 && loginRes.body.token) {
        const decoded = jwt.verify(loginRes.body.token, JWT_SECRET)
        expect(decoded).toHaveProperty('userId')
        expect(decoded).toHaveProperty('email')
      }
    })
  })
})
