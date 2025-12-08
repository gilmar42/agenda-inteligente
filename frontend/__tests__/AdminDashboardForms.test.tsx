import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/context/AuthContext'
import AdminDashboardNew from '../src/pages/AdminDashboardNew'

global.fetch = jest.fn()

describe('AdminDashboardNew - Complete Form Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('auth_token', 'test-token-123')
    localStorage.setItem('auth_user', JSON.stringify({
      id: 'user-123',
      email: 'admin@example.com',
      name: 'Admin User'
    }))
  })

  const renderAdmin = () => {
    return render(
      <AuthProvider>
        <BrowserRouter>
          <AdminDashboardNew />
        </BrowserRouter>
      </AuthProvider>
    )
  }

  describe('Tab Navigation', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          stats: { totalAppointments: 5, totalClients: 3, totalRevenue: 1500, pendingAppointments: 1 },
          appointments: [],
          clients: [],
          services: []
        })
      })
    })

    it('should render all tabs', async () => {
      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText(/visão geral/i)).toBeInTheDocument()
        expect(screen.getByText(/agendamentos/i)).toBeInTheDocument()
        expect(screen.getByText(/clientes/i)).toBeInTheDocument()
        expect(screen.getByText(/serviços/i)).toBeInTheDocument()
        expect(screen.getByText(/relatórios/i)).toBeInTheDocument()
        expect(screen.getByText(/configurações/i)).toBeInTheDocument()
        expect(screen.getByText(/integrações/i)).toBeInTheDocument()
      })
    })

    it('should switch to appointments tab', async () => {
      renderAdmin()

      const appointmentsTab = screen.getByText(/agendamentos/i).closest('button')
      fireEvent.click(appointmentsTab!)

      await waitFor(() => {
        expect(screen.getByText(/novo agendamento/i)).toBeInTheDocument()
      })
    })

    it('should switch to clients tab', async () => {
      renderAdmin()

      const clientsTab = screen.getByText(/clientes/i).closest('button')
      fireEvent.click(clientsTab!)

      await waitFor(() => {
        expect(screen.getByText(/novo cliente/i)).toBeInTheDocument()
      })
    })

    it('should switch to services tab', async () => {
      renderAdmin()

      const servicesTab = screen.getByText(/serviços/i).closest('button')
      fireEvent.click(servicesTab!)

      await waitFor(() => {
        expect(screen.getByText(/novo serviço/i)).toBeInTheDocument()
      })
    })
  })

  describe('Appointment Form', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          stats: { totalAppointments: 0, totalClients: 0, totalRevenue: 0, pendingAppointments: 0 },
          appointments: [],
          clients: [],
          services: []
        })
      })
    })

    it('should display appointment form fields', async () => {
      renderAdmin()

      const appointmentsTab = screen.getByText(/agendamentos/i).closest('button')
      fireEvent.click(appointmentsTab!)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/nome do cliente/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/\(11\) 99999-9999/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/serviço/i)).toBeInTheDocument()
      })
    })

    it('should validate appointment form before submit', async () => {
      renderAdmin()

      const appointmentsTab = screen.getByText(/agendamentos/i).closest('button')
      fireEvent.click(appointmentsTab!)

      const submitBtn = screen.getByText(/novo agendamento/i).closest('button')
      fireEvent.click(submitBtn!)

      await waitFor(() => {
        expect(screen.getByText(/informe o cliente/i)).toBeInTheDocument()
      })
    })

    it('should submit appointment form with valid data', async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              stats: { totalAppointments: 1, totalClients: 0, totalRevenue: 0, pendingAppointments: 1 },
              appointments: [],
              clients: [],
              services: []
            })
          })
        }
        if (url.includes('/appointments')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 'appt-123' })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })

      renderAdmin()

      const appointmentsTab = screen.getByText(/agendamentos/i).closest('button')
      fireEvent.click(appointmentsTab!)

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText(/nome do cliente/i)
        fireEvent.change(inputs[0], { target: { value: 'John Doe' } })
      })

      const phoneInputs = screen.getAllByPlaceholderText(/\(11\) 99999-9999/i)
      fireEvent.change(phoneInputs[0], { target: { value: '(11) 99999-9999' } })

      const serviceInputs = screen.getAllByPlaceholderText(/serviço/i)
      fireEvent.change(serviceInputs[0], { target: { value: 'Haircut' } })

      const submitBtn = screen.getByText(/novo agendamento/i).closest('button')
      fireEvent.click(submitBtn!)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/appointments'),
          expect.objectContaining({ method: 'POST' })
        )
      })
    })
  })

  describe('Client Form', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          stats: { totalAppointments: 0, totalClients: 0, totalRevenue: 0, pendingAppointments: 0 },
          appointments: [],
          clients: [],
          services: []
        })
      })
    })

    it('should display client form fields', async () => {
      renderAdmin()

      const clientsTab = screen.getByText(/clientes/i).closest('button')
      fireEvent.click(clientsTab!)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/nome do cliente/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/cliente@email.com/i)).toBeInTheDocument()
      })
    })

    it('should validate client form', async () => {
      renderAdmin()

      const clientsTab = screen.getByText(/clientes/i).closest('button')
      fireEvent.click(clientsTab!)

      const submitBtn = screen.getByText(/novo cliente/i).closest('button')
      fireEvent.click(submitBtn!)

      await waitFor(() => {
        expect(screen.getByText(/informe o nome do cliente/i)).toBeInTheDocument()
      })
    })

    it('should submit client form with valid data', async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              stats: { totalAppointments: 0, totalClients: 1, totalRevenue: 0, pendingAppointments: 0 },
              appointments: [],
              clients: [],
              services: []
            })
          })
        }
        if (url.includes('/clients')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 'client-123' })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })

      renderAdmin()

      const clientsTab = screen.getByText(/clientes/i).closest('button')
      fireEvent.click(clientsTab!)

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText(/nome do cliente/i)
        fireEvent.change(inputs[0], { target: { value: 'Jane Smith' } })
      })

      const submitBtn = screen.getByText(/novo cliente/i).closest('button')
      fireEvent.click(submitBtn!)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/clients'),
          expect.objectContaining({ method: 'POST' })
        )
      })
    })
  })

  describe('Service Form', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          stats: { totalAppointments: 0, totalClients: 0, totalRevenue: 0, pendingAppointments: 0 },
          appointments: [],
          clients: [],
          services: []
        })
      })
    })

    it('should display service form fields', async () => {
      renderAdmin()

      const servicesTab = screen.getByText(/serviços/i).closest('button')
      fireEvent.click(servicesTab!)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/nome do serviço/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/0,00/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/30/i)).toBeInTheDocument()
      })
    })

    it('should validate service form', async () => {
      renderAdmin()

      const servicesTab = screen.getByText(/serviços/i).closest('button')
      fireEvent.click(servicesTab!)

      const submitBtn = screen.getByText(/novo serviço/i).closest('button')
      fireEvent.click(submitBtn!)

      await waitFor(() => {
        expect(screen.getByText(/informe o nome do serviço/i)).toBeInTheDocument()
      })
    })

    it('should submit service form with valid data', async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              stats: { totalAppointments: 0, totalClients: 0, totalRevenue: 0, pendingAppointments: 0 },
              appointments: [],
              clients: [],
              services: [{ id: 'svc-123', name: 'Premium Cut', price: 5000, duration: 60 }]
            })
          })
        }
        if (url.includes('/services')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 'svc-123' })
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })

      renderAdmin()

      const servicesTab = screen.getByText(/serviços/i).closest('button')
      fireEvent.click(servicesTab!)

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText(/nome do serviço/i)
        fireEvent.change(inputs[0], { target: { value: 'Premium Haircut' } })
      })

      const priceInputs = screen.getAllByPlaceholderText(/0,00/i)
      fireEvent.change(priceInputs[0], { target: { value: '50.00' } })

      const submitBtn = screen.getByText(/novo serviço/i).closest('button')
      fireEvent.click(submitBtn!)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/services'),
          expect.objectContaining({ method: 'POST' })
        )
      })
    })
  })

  describe('Search and Filter', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          stats: { totalAppointments: 2, totalClients: 2, totalRevenue: 1000, pendingAppointments: 1 },
          appointments: [
            { id: '1', client: 'John', service: 'Cut', date: '2025-12-08T10:00:00', status: 'pending' },
            { id: '2', client: 'Jane', service: 'Color', date: '2025-12-08T14:00:00', status: 'confirmed' }
          ],
          clients: [
            { id: '1', name: 'John Doe', phone: '111', email: 'john@ex.com', totalAppointments: 1 },
            { id: '2', name: 'Jane Smith', phone: '222', email: 'jane@ex.com', totalAppointments: 1 }
          ],
          services: []
        })
      })
    })

    it('should search appointments', async () => {
      renderAdmin()

      const appointmentsTab = screen.getByText(/agendamentos/i).closest('button')
      fireEvent.click(appointmentsTab!)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/pesquisar agendamentos/i)
        fireEvent.change(searchInput, { target: { value: 'john' } })
      })

      await waitFor(() => {
        expect(screen.getByText(/john/i)).toBeInTheDocument()
      })
    })

    it('should search clients', async () => {
      renderAdmin()

      const clientsTab = screen.getByText(/clientes/i).closest('button')
      fireEvent.click(clientsTab!)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/pesquisar clientes/i)
        fireEvent.change(searchInput, { target: { value: 'jane' } })
      })

      await waitFor(() => {
        expect(screen.getByText(/jane/i)).toBeInTheDocument()
      })
    })
  })

  describe('Overview Stats', () => {
    it('should display overview stats', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
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

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText(/total de agendamentos/i)).toBeInTheDocument()
        expect(screen.getByText(/10/)).toBeInTheDocument()
        expect(screen.getByText(/total de clientes/i)).toBeInTheDocument()
        expect(screen.getByText(/5/)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      renderAdmin()

      await waitFor(() => {
        expect(screen.getByText(/erro ao carregar dashboard/i)).toBeInTheDocument()
      })
    })

    it('should handle 401 unauthorized', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        status: 401,
        ok: false
      })

      const { location } = window
      delete (window as any).location
      ;(window as any).location = { href: '' }

      renderAdmin()

      await waitFor(() => {
        // Should redirect to login
        expect((window.location as any).href).toBe('/login')
      })

      ;(window as any).location = location
    })
  })
})
