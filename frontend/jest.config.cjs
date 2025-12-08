module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx|js)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        module: 'esnext',
        target: 'ES2020',
        moduleResolution: 'node'
      }
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/**/*.d.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      useESM: true,
      isolatedModules: true
    }
  }
}
