import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext'
import ProtectedRoute from '../src/components/ProtectedRoute'

const TestComponent = () => <div>Protected Content</div>

const renderWithProviders = (component: React.ReactNode, hasToken = false) => {
  if (hasToken) {
    localStorage.setItem('auth_token', 'test-token')
    localStorage.setItem('auth_user', JSON.stringify({ id: '1', email: 'test@example.com' }))
  }
  
  return render(
    <AuthProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </AuthProvider>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should render protected content when user is authenticated', async () => {
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      true
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('should redirect to login when user is not authenticated', async () => {
    const { container } = renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      false
    )

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  it('should check localStorage as fallback', async () => {
    localStorage.setItem('auth_token', 'fallback-token')
    
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      false
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})
