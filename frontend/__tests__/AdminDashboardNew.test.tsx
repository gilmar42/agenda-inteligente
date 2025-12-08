import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext'
import AdminDashboardNew from '../src/pages/AdminDashboardNew'

global.fetch = jest.fn()

const renderDashboard = () => {
  localStorage.setItem('auth_token', 'test-token')
  localStorage.setItem('auth_user', JSON.stringify({ id: '1', email: 'test@example.com', name: 'Test User' }))

  return render(
    <AuthProvider>
      <BrowserRouter>
        <AdminDashboardNew />
      </BrowserRouter>
    </AuthProvider>
  )
}

describe('AdminDashboardNew', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should render dashboard header', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: {
          totalAppointments: 10,
          totalClients: 5,
          totalRevenue: 5000,
          pendingAppointments: 2
        },
        appointments: [],
        clients: [],
        services: []
      })
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/painel administrativo/i)).toBeInTheDocument()
    })
  })

  it('should display loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    renderDashboard()

    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('should display stats on successful data load', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: {
          totalAppointments: 24,
          totalClients: 12,
          totalRevenue: 2400,
          pendingAppointments: 3
        },
        appointments: [],
        clients: [],
        services: []
      })
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/total de agendamentos/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle fetch errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/painel administrativo/i)).toBeInTheDocument()
    })
  })

  it('should render with empty data arrays', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: { totalAppointments: 0, totalClients: 0, totalRevenue: 0, pendingAppointments: 0 },
        appointments: [],
        clients: [],
        services: []
      })
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/painel administrativo/i)).toBeInTheDocument()
    })
  })

  it('should handle undefined data safely', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: undefined,
        appointments: undefined,
        clients: undefined,
        services: undefined
      })
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/painel administrativo/i)).toBeInTheDocument()
    })
  })

  it('should not crash when component mounts and unmounts', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: { totalAppointments: 5, totalClients: 2, totalRevenue: 1000, pendingAppointments: 1 },
        appointments: [],
        clients: [],
        services: []
      })
    })

    const { unmount } = renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/painel administrativo/i)).toBeInTheDocument()
    })

    unmount()
    expect(true).toBe(true)
  })
})
