import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext'
import Signup from '../src/pages/Signup'

global.fetch = jest.fn()

describe('Signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should render signup form', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Signup />
        </BrowserRouter>
      </AuthProvider>
    )

    expect(screen.getByText(/cadastro/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/nome/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/mínimo 8 caracteres/i)).toBeInTheDocument()
  })

  it('should allow name input', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Signup />
        </BrowserRouter>
      </AuthProvider>
    )

    const nameInput = screen.getByPlaceholderText(/nome/i) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'João Silva' } })

    expect(nameInput.value).toBe('João Silva')
  })

  it('should allow email input', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Signup />
        </BrowserRouter>
      </AuthProvider>
    )

    const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement
    fireEvent.change(emailInput, { target: { value: 'joao@example.com' } })

    expect(emailInput.value).toBe('joao@example.com')
  })

  it('should allow password input', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Signup />
        </BrowserRouter>
      </AuthProvider>
    )

    const passwordInput = screen.getByPlaceholderText(/mínimo 8 caracteres/i) as HTMLInputElement
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(passwordInput.value).toBe('password123')
  })

  it('should show login link', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Signup />
        </BrowserRouter>
      </AuthProvider>
    )

    const loginLink = screen.getByRole('link')
    expect(loginLink).toHaveAttribute('href', '/login')
  })
})
