import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '../src/context/AuthContext'
import Signup from '../src/pages/Signup'

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

describe('Signup Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should render signup form with required fields', () => {
    renderWithProviders(<Signup />)
    
    expect(screen.getByPlaceholderText(/nome/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email ou telefone/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/^senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /registrar/i })).toBeInTheDocument()
  })

  it('should validate empty fields', async () => {
    renderWithProviders(<Signup />)
    
    const submitButton = screen.getByRole('button', { name: /registrar/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/todos os campos são obrigatórios/i)).toBeInTheDocument()
    })
  })

  it('should validate password confirmation match', async () => {
    renderWithProviders(<Signup />)
    
    const nameInput = screen.getByPlaceholderText(/nome/i)
    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    const passwordInput = screen.getByPlaceholderText(/^senha/i)
    const confirmInput = screen.getByPlaceholderText(/confirme/i)
    const submitButton = screen.getByRole('button', { name: /registrar/i })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'different123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/senhas não conferem/i)).toBeInTheDocument()
    })
  })

  it('should validate password strength', async () => {
    renderWithProviders(<Signup />)
    
    const nameInput = screen.getByPlaceholderText(/nome/i)
    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    const passwordInput = screen.getByPlaceholderText(/^senha/i)
    const confirmInput = screen.getByPlaceholderText(/confirme/i)
    const submitButton = screen.getByRole('button', { name: /registrar/i })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.change(confirmInput, { target: { value: '123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/senha deve ter no mínimo/i)).toBeInTheDocument()
    })
  })

  it('should send signup request with correct data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        token: 'test-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      })
    })

    renderWithProviders(<Signup />)
    
    const nameInput = screen.getByPlaceholderText(/nome/i)
    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    const passwordInput = screen.getByPlaceholderText(/^senha/i)
    const confirmInput = screen.getByPlaceholderText(/confirme/i)
    const submitButton = screen.getByRole('button', { name: /registrar/i })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/signup'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
          })
        })
      )
    })
  })

  it('should save token to localStorage on successful signup', async () => {
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

    renderWithProviders(<Signup />)
    
    const nameInput = screen.getByPlaceholderText(/nome/i)
    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    const passwordInput = screen.getByPlaceholderText(/^senha/i)
    const confirmInput = screen.getByPlaceholderText(/confirme/i)
    const submitButton = screen.getByRole('button', { name: /registrar/i })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe(testToken)
      expect(localStorage.getItem('auth_user')).toBe(JSON.stringify(testUser))
    })
  })

  it('should handle signup errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        ok: false,
        errors: ['Email já registrado']
      })
    })

    renderWithProviders(<Signup />)
    
    const nameInput = screen.getByPlaceholderText(/nome/i)
    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    const passwordInput = screen.getByPlaceholderText(/^senha/i)
    const confirmInput = screen.getByPlaceholderText(/confirme/i)
    const submitButton = screen.getByRole('button', { name: /registrar/i })

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email já registrado/i)).toBeInTheDocument()
    })
  })
})
