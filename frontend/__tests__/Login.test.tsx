import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '../src/context/AuthContext'
import Login from '../src/pages/Login'

// Mock fetch
global.fetch = jest.fn()

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      <AuthProvider>
        <BrowserRouter>{component}</BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should render login form with email and password fields', () => {
    renderWithProviders(<Login />)
    
    expect(screen.getByPlaceholderText(/email ou telefone/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('should validate empty fields', async () => {
    renderWithProviders(<Login />)
    
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email\/telefone e senha são obrigatórios/i)).toBeInTheDocument()
    })
  })

  it('should send login request with email', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        token: 'test-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      })
    })

    renderWithProviders(<Login />)
    
    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    const passwordInput = screen.getByPlaceholderText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      )
    })
  })

  it('should send login request with phone', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        token: 'test-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      })
    })

    renderWithProviders(<Login />)
    
    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    const passwordInput = screen.getByPlaceholderText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })

    fireEvent.change(emailInput, { target: { value: '+5511999999999' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            phone: '+5511999999999',
            password: 'password123'
          })
        })
      )
    })
  })

  it('should save token to localStorage on successful login', async () => {
    const testToken = 'test-auth-token'
    const testUser = { id: '1', email: 'test@example.com', name: 'Test User' }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        token: testToken,
        user: testUser
      })
    })

    renderWithProviders(<Login />)
    
    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    const passwordInput = screen.getByPlaceholderText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe(testToken)
      expect(localStorage.getItem('auth_user')).toBe(JSON.stringify(testUser))
    })
  })

  it('should display error on failed login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        ok: false,
        errors: ['Email/telefone ou senha inválidos']
      })
    })

    renderWithProviders(<Login />)
    
    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    const passwordInput = screen.getByPlaceholderText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email\/telefone ou senha inválidos/i)).toBeInTheDocument()
    })
  })

  it('should handle network errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    renderWithProviders(<Login />)
    
    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    const passwordInput = screen.getByPlaceholderText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/erro de conexão/i)).toBeInTheDocument()
    })
  })
})
