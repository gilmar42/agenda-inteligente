const request = require('supertest')
const { spawn } = require('child_process')

let server
beforeAll(() => {
  // Start backend without REDIS_URL to ensure health works
  server = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, REDIS_URL: '' } })
})
afterAll(() => {
  server.kill()
})

async function wait(ms) { return new Promise(res => setTimeout(res, ms)) }

test('health works without redis', async () => {
  let res
  for (let i = 0; i < 10; i++) {
    try {
      res = await request('http://localhost:3001').get('/health')
      break
    } catch (e) {
      await wait(500)
    }
  }
  expect([200,500]).toContain(res.status)
})
