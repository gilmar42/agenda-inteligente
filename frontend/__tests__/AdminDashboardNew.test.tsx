import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

  it('should render dashboard header with user info', async () => {
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
      expect(screen.getByText(/test user/i)).toBeInTheDocument()
    })
  })

  it('should display loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    renderDashboard()

    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('should display stats cards on overview tab', async () => {
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
      expect(screen.getByText(/24/)).toBeInTheDocument()
      expect(screen.getByText(/total de clientes/i)).toBeInTheDocument()
      expect(screen.getByText(/12/)).toBeInTheDocument()
    })
  })

  it('should switch between tabs', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: {
          totalAppointments: 10,
          totalClients: 5,
          totalRevenue: 5000,
          pendingAppointments: 2
        },
        appointments: [
          { id: '1', client: 'João', service: 'Corte', date: '2024-12-07', status: 'confirmado' }
        ],
        clients: [],
        services: []
      })
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/visão geral/i)).toBeInTheDocument()
    })

    const agendamentosTab = screen.getByRole('button', { name: /agendamentos/i })
    fireEvent.click(agendamentosTab)

    await waitFor(() => {
      expect(screen.getByText(/joão/)).toBeInTheDocument()
      expect(screen.getByText(/corte/)).toBeInTheDocument()
    })
  })

  it('should display appointments list with search', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: {
          totalAppointments: 10,
          totalClients: 5,
          totalRevenue: 5000,
          pendingAppointments: 2
        },
        appointments: [
          { id: '1', client: 'João Silva', service: 'Corte', date: '2024-12-07', status: 'confirmado' },
          { id: '2', client: 'Maria Santos', service: 'Coloração', date: '2024-12-08', status: 'pendente' }
        ],
        clients: [],
        services: []
      })
    })

    renderDashboard()

    const agendamentosTab = screen.getByRole('button', { name: /agendamentos/i })
    fireEvent.click(agendamentosTab)

    await waitFor(() => {
      expect(screen.getByText(/joão silva/i)).toBeInTheDocument()
      expect(screen.getByText(/maria santos/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/pesquisar agendamentos/i)
    fireEvent.change(searchInput, { target: { value: 'joão' } })

    await waitFor(() => {
      expect(screen.getByText(/joão silva/i)).toBeInTheDocument()
      expect(screen.queryByText(/maria santos/i)).not.toBeInTheDocument()
    })
  })

  it('should display clients list', async () => {
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
        clients: [
          { id: '1', name: 'João Silva', phone: '11999999999', email: 'joao@example.com', totalAppointments: 5 },
          { id: '2', name: 'Maria Santos', phone: '11988888888', email: 'maria@example.com', totalAppointments: 3 }
        ],
        services: []
      })
    })

    renderDashboard()

    const clientesTab = screen.getByRole('button', { name: /clientes/i })
    fireEvent.click(clientesTab)

    await waitFor(() => {
      expect(screen.getByText(/joão silva/i)).toBeInTheDocument()
      expect(screen.getByText(/11999999999/)).toBeInTheDocument()
      expect(screen.getByText(/maria santos/i)).toBeInTheDocument()
    })
  })

  it('should display services list', async () => {
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
        services: [
          { id: '1', name: 'Corte Masculino', price: 5000, duration: 30 },
          { id: '2', name: 'Coloração', price: 15000, duration: 120 }
        ]
      })
    })

    renderDashboard()

    const servicosTab = screen.getByRole('button', { name: /serviços/i })
    fireEvent.click(servicosTab)

    await waitFor(() => {
      expect(screen.getByText(/corte masculino/i)).toBeInTheDocument()
      expect(screen.getByText(/coloração/i)).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar dashboard/i)).toBeInTheDocument()
    })
  })

  it('should redirect to login on 401 error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 401,
      ok: false
    })

    delete (window as any).location
    ;(window as any).location = { href: '' }

    renderDashboard()

    await waitFor(() => {
      expect(window.location.href).toBe('/login')
    })
  })

  it('should handle undefined data safely', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: null,
        appointments: undefined,
        clients: null,
        services: undefined
      })
    })

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/painel administrativo/i)).toBeInTheDocument()
    })
  })

  it('should display empty state messages', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stats: {
          totalAppointments: 0,
          totalClients: 0,
          totalRevenue: 0,
          pendingAppointments: 0
        },
        appointments: [],
        clients: [],
        services: []
      })
    })

    renderDashboard()

    const agendamentosTab = screen.getByRole('button', { name: /agendamentos/i })
    fireEvent.click(agendamentosTab)

    await waitFor(() => {
      expect(screen.getByText(/nenhum agendamento encontrado/i)).toBeInTheDocument()
    })
  })
})
