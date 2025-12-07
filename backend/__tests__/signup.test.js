const request = require('supertest')
const { spawn } = require('child_process')
jest.setTimeout(15000)

let server
beforeAll(() => {
  server = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, REDIS_URL: '' } })
})
afterAll(() => {
  server.kill()
})

async function wait(ms) { return new Promise(res => setTimeout(res, ms)) }

test('signup fails when missing email and phone', async () => {
  let res
  for (let i = 0; i < 20; i++) {
    try {
      res = await request('http://localhost:3001')
        .post('/signup')
        .send({ password: '12345678' })
        .set('Content-Type', 'application/json')
      break
    } catch (e) {
      await wait(500)
    }
  }
  expect(res.status).toBe(400)
  expect(res.body.errors).toContain('email_or_phone_required')
})

test('signup succeeds with email', async () => {
  const res = await request('http://localhost:3001')
    .post('/signup')
    .send({ email: 'user@example.com', password: 'Str0ngPass!' })
    .set('Content-Type', 'application/json')
  expect(res.status).toBe(200)
  expect(res.body.ok).toBe(true)
  expect(res.body.user.email).toBe('user@example.com')
})
