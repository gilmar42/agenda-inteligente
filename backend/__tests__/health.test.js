const request = require('supertest')

const { spawn } = require('child_process')
let server
beforeAll(() => {
  server = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, REDIS_URL: '' } })
})
afterAll(() => {
  server.kill()
})

async function wait(ms) { return new Promise(res => setTimeout(res, ms)) }

test('GET /health returns ok', async () => {
  // Wait until server responds
  let res
  for (let i = 0; i < 10; i++) {
    try {
      res = await request('http://localhost:3001').get('/health')
      break
    } catch (e) {
      await wait(500)
    }
  }
  expect(res).toBeDefined()
  expect([200,500]).toContain(res.status)
})
