import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext'
import Login from '../src/pages/Login'

global.fetch = jest.fn()

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should render login form', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    )

    expect(screen.getByText(/login/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email ou telefone/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/senha/i)).toBeInTheDocument()
  })

  it('should validate empty fields', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    )

    const submitButton = screen.getByRole('button', { name: /entrar/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/obrigatório/i)).toBeInTheDocument()
    })
  })

  it('should allow email input', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    )

    const emailInput = screen.getByPlaceholderText(/email ou telefone/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    expect((emailInput as HTMLInputElement).value).toBe('test@example.com')
  })

  it('should allow password input', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    )

    const passwordInput = screen.getByPlaceholderText(/senha/i)
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect((passwordInput as HTMLInputElement).value).toBe('password123')
  })

  it('should show signup link', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    )

    const signupLink = screen.getByRole('link')
    expect(signupLink).toHaveAttribute('href', '/signup')
  })
})
