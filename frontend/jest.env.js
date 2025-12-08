// Setup environment variables for tests
global.import = {
  ...global.import,
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3001',
      VITE_GOOGLE_CLIENT_ID: 'test-client-id'
    }
  }
}

