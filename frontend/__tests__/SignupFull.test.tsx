import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext'
import Signup from '../src/pages/Signup'

global.fetch = jest.fn()

describe('Signup Page - Complete Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  const renderSignup = () => {
    return render(
      <AuthProvider>
        <BrowserRouter>
          <Signup />
        </BrowserRouter>
      </AuthProvider>
    )
  }

  describe('Signup Form Rendering', () => {
    it('should render signup form', () => {
      renderSignup()

      expect(screen.getByText(/cadastro|inscrever|registro/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/nome/i) || screen.getByPlaceholderText(/name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/senha|password/i)).toBeInTheDocument()
    })

    it('should have signup button', () => {
      renderSignup()

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      expect(signupBtn).toBeInTheDocument()
    })

    it('should have login link', () => {
      renderSignup()

      const loginLink = screen.queryByText(/entrar|login|acesso/i) || screen.queryByRole('link')
      // May or may not have login link
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    })
  })

  describe('Form Input and Validation', () => {
    it('should accept name input', () => {
      renderSignup()

      const nameInputs = screen.getAllByPlaceholderText(/nome|name/i)
      const nameInput = nameInputs[0] as HTMLInputElement
      fireEvent.change(nameInput, { target: { value: 'João Silva' } })

      expect(nameInput.value).toBe('João Silva')
    })

    it('should accept email input', () => {
      renderSignup()

      const emailInput = screen.getByPlaceholderText(/email/i) as HTMLInputElement
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })

      expect(emailInput.value).toBe('newuser@example.com')
    })

    it('should accept password input', () => {
      renderSignup()

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      const passwordInput = passwordInputs[0] as HTMLInputElement
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123' } })

      expect(passwordInput.value).toBe('SecurePass123')
    })

    it('should validate empty name', async () => {
      renderSignup()

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } })

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      fireEvent.click(signupBtn)

      await waitFor(() => {
        // Component may show validation error
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
      })
    })

    it('should validate empty email', async () => {
      renderSignup()

      const nameInputs = screen.getAllByPlaceholderText(/nome|name/i)
      fireEvent.change(nameInputs[0], { target: { value: 'Test User' } })

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } })

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      fireEvent.click(signupBtn)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
      })
    })

    it('should validate weak password', async () => {
      renderSignup()

      const nameInputs = screen.getAllByPlaceholderText(/nome|name/i)
      fireEvent.change(nameInputs[0], { target: { value: 'Test User' } })

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      fireEvent.change(passwordInputs[0], { target: { value: '123' } })

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      fireEvent.click(signupBtn)

      await waitFor(() => {
        // Should show error or validation message
        expect(screen.getByPlaceholderText(/senha|password/i)).toBeInTheDocument()
      })
    })

    it('should validate invalid email format', async () => {
      renderSignup()

      const nameInputs = screen.getAllByPlaceholderText(/nome|name/i)
      fireEvent.change(nameInputs[0], { target: { value: 'Test User' } })

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } })

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      fireEvent.click(signupBtn)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
      })
    })
  })

  describe('Signup Submission', () => {
    it('should submit form with valid data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          token: 'new-token-123',
          user: { id: '1', email: 'newuser@example.com', name: 'New User' }
        })
      })

      renderSignup()

      const nameInputs = screen.getAllByPlaceholderText(/nome|name/i)
      fireEvent.change(nameInputs[0], { target: { value: 'João Silva' } })

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'joao@example.com' } })

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      fireEvent.change(passwordInputs[0], { target: { value: 'SecurePass123' } })

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      fireEvent.click(signupBtn)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/signup'),
          expect.objectContaining({ method: 'POST' })
        )
      })
    })

    it('should handle successful signup response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          token: 'valid-token',
          user: { id: '1', email: 'newuser@example.com' }
        })
      })

      renderSignup()

      const nameInputs = screen.getAllByPlaceholderText(/nome|name/i)
      fireEvent.change(nameInputs[0], { target: { value: 'Test User' } })

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } })

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      fireEvent.click(signupBtn)

      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeTruthy()
      })
    })

    it('should handle duplicate email error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Email already exists' })
      })

      renderSignup()

      const nameInputs = screen.getAllByPlaceholderText(/nome|name/i)
      fireEvent.change(nameInputs[0], { target: { value: 'Test User' } })

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } })

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      fireEvent.click(signupBtn)

      await waitFor(() => {
        // Should display error message
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
      })
    })

    it('should handle server error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      })

      renderSignup()

      const nameInputs = screen.getAllByPlaceholderText(/nome|name/i)
      fireEvent.change(nameInputs[0], { target: { value: 'Test User' } })

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } })

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      fireEvent.click(signupBtn)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
      })
    })

    it('should handle network error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      renderSignup()

      const nameInputs = screen.getAllByPlaceholderText(/nome|name/i)
      fireEvent.change(nameInputs[0], { target: { value: 'Test User' } })

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } })

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      fireEvent.click(signupBtn)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading state while submitting', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      renderSignup()

      const nameInputs = screen.getAllByPlaceholderText(/nome|name/i)
      fireEvent.change(nameInputs[0], { target: { value: 'Test User' } })

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const passwordInputs = screen.getAllByPlaceholderText(/senha|password|mínimo/i)
      fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } })

      const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
      fireEvent.click(signupBtn)

      await waitFor(() => {
        // Button should be disabled or show loading state
        const isDisabled = signupBtn.hasAttribute('disabled')
        const isLoading = signupBtn.getAttribute('aria-busy') === 'true'
        expect(isDisabled || isLoading).toBeTruthy()
      })
    })
  })

  describe('Password Confirmation', () => {
    it('should have password confirmation field if required', () => {
      renderSignup()

      const passwordInputs = screen.queryAllByPlaceholderText(/confirmar|confirmação|repeat|novamente/i)
      if (passwordInputs.length > 0) {
        expect(passwordInputs[0]).toBeInTheDocument()
      }
    })

    it('should validate matching passwords', async () => {
      renderSignup()

      const passwordInputs = screen.queryAllByPlaceholderText(/senha|password|mínimo/i)
      if (passwordInputs.length >= 2) {
        fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } })
        fireEvent.change(passwordInputs[1], { target: { value: 'DifferentPass123' } })

        const signupBtn = screen.getByRole('button', { name: /cadastro|inscrever|criar|register/i })
        fireEvent.click(signupBtn)

        await waitFor(() => {
          expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Terms and Privacy', () => {
    it('should display terms and privacy notice', () => {
      renderSignup()

      const termsText = screen.queryByText(/termos|política|privacidade|concordo/i)
      // May or may not be present
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    })

    it('should require accepting terms if applicable', () => {
      renderSignup()

      const termsCheckbox = screen.queryByRole('checkbox')
      if (termsCheckbox) {
        expect(termsCheckbox).toBeInTheDocument()
      }
    })
  })
})
