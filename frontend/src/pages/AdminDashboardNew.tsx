import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import './AdminDashboard.css'

const AdminDashboardNew: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [searchAppointments, setSearchAppointments] = useState('')
  const [searchClients, setSearchClients] = useState('')
  const [searchServices, setSearchServices] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<{ appointment: boolean; client: boolean; service: boolean }>({ appointment: false, client: false, service: false })
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' })
  
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalClients: 0,
    totalRevenue: 0,
    pendingAppointments: 0
  })
  const [appointments, setAppointments] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [newAppointment, setNewAppointment] = useState({ client: '', phone: '', service: '', date: '', status: 'pending', notes: '' })
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' })
  const [newService, setNewService] = useState({ name: '', price: '', duration: '', description: '' })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const headers = { Authorization: `Bearer ${token}` }
      const [dashboardRes, clientsRes, servicesRes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard`, { headers }),
        fetch(`${API_URL}/admin/clients`, { headers }),
        fetch(`${API_URL}/admin/services`, { headers })
      ])

      if (dashboardRes.status === 401 || clientsRes.status === 401 || servicesRes.status === 401) {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
        return
      }

      if (dashboardRes.ok) {
        const dashboard = await dashboardRes.json()
        const clientsData = clientsRes.ok ? await clientsRes.json().catch(() => []) : []
        const servicesData = servicesRes.ok ? await servicesRes.json().catch(() => []) : []

        setStats(dashboard?.stats || {
          totalAppointments: 0,
          totalClients: (dashboard?.clients || clientsData || []).length,
          totalRevenue: 0,
          pendingAppointments: 0
        })
        setAppointments(dashboard?.appointments || [])
        setClients(dashboard?.clients?.length ? dashboard.clients : clientsData || [])
        setServices(dashboard?.services?.length ? dashboard.services : servicesData || [])
      }
    } catch (err: any) {
      console.error('Dashboard error:', err)
      setError(err?.message || 'Erro ao carregar dashboard')
      setStats({
        totalAppointments: 0,
        totalClients: 0,
        totalRevenue: 0,
        pendingAppointments: 0
      })
      setAppointments([])
      setClients([])
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (type: string, id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar?')) return
    
    try {
      const token = localStorage.getItem('auth_token')
      const endpoint = type === 'appointment' ? 'appointments' : type === 'client' ? 'clients' : 'services'
      const response = await fetch(`${API_URL}/admin/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        loadDashboardData()
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  if (loading) {
    return (
      <main className="admin-dashboard">
        <header className="admin-header">
          <div className="header-content">
            <h1>Painel Administrativo</h1>
          </div>
        </header>
        <div className="loading">Carregando...</div>
      </main>
    )
  }

  const appointmentsList = Array.isArray(appointments) ? appointments : []
  const clientsList = Array.isArray(clients) ? clients : []
  const servicesList = Array.isArray(services) ? services : []

  const normalize = (value: any) => (value ? value.toString().toLowerCase() : '')
  const formatDate = (value: any) => {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  }

  const getToken = () => localStorage.getItem('auth_token')

  const handleCreate = async (type: 'appointment' | 'client' | 'service') => {
    setFormMessage({ type: null, text: '' })
    const token = getToken()
    if (!token) {
      window.location.href = '/login'
      return
    }

    const validations: Record<typeof type, () => string | null> = {
      appointment: () => {
        if (!newAppointment.client.trim()) return 'Informe o cliente'
        if (!newAppointment.service.trim()) return 'Informe o serviço'
        if (!newAppointment.date) return 'Informe data e hora'
        return null
      },
      client: () => {
        if (!newClient.name.trim()) return 'Informe o nome do cliente'
        if (!newClient.phone.trim() && !newClient.email.trim()) return 'Informe telefone ou email'
        return null
      },
      service: () => {
        if (!newService.name.trim()) return 'Informe o nome do serviço'
        if (!newService.price) return 'Informe o preço'
        if (!newService.duration) return 'Informe a duração'
        return null
      }
    }

    const validationError = validations[type]()
    if (validationError) {
      setFormMessage({ type: 'error', text: validationError })
      return
    }

    const endpoint = type === 'appointment' ? 'appointments' : type === 'client' ? 'clients' : 'services'
    const payload = type === 'appointment'
      ? {
          clientName: newAppointment.client,
          phone: newAppointment.phone,
          service: newAppointment.service,
          date: newAppointment.date,
          status: newAppointment.status,
          notes: newAppointment.notes
        }
      : type === 'client'
        ? { ...newClient }
        : { ...newService, price: Math.round(Number(newService.price || 0) * 100), duration: Number(newService.duration || 0) }

    try {
      setSaving((prev) => ({ ...prev, [type]: true }))
      setError(null)

      const response = await fetch(`${API_URL}/admin/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const msg = (await response.json().catch(() => null))?.error || 'Erro ao salvar'
        throw new Error(msg)
      }

      // reset forms
      if (type === 'appointment') setNewAppointment({ client: '', phone: '', service: '', date: '', status: 'pending', notes: '' })
      if (type === 'client') setNewClient({ name: '', phone: '', email: '' })
      if (type === 'service') setNewService({ name: '', price: '', duration: '', description: '' })

      setFormMessage({ type: 'success', text: 'Registro salvo com sucesso' })
      await loadDashboardData()
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar')
      setFormMessage({ type: 'error', text: err?.message || 'Erro ao salvar' })
    } finally {
      setSaving((prev) => ({ ...prev, [type]: false }))
    }
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <h1>Painel Administrativo</h1>
          <div className="header-actions">
            <span className="user-info">{user?.name || user?.email || 'Admin'}</span>
          </div>
        </div>
      </header>

      <div className="admin-tabs">
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Visão Geral
          </button>
          <button
            className={`tab-button ${activeTab === 'agendamentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('agendamentos')}
          >
            📅 Agendamentos
          </button>
          <button
            className={`tab-button ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => setActiveTab('clientes')}
          >
            👥 Clientes
          </button>
          <button
            className={`tab-button ${activeTab === 'servicos' ? 'active' : ''}`}
            onClick={() => setActiveTab('servicos')}
          >
            🛠️ Serviços
          </button>
          <button
            className={`tab-button ${activeTab === 'relatorios' ? 'active' : ''}`}
            onClick={() => setActiveTab('relatorios')}
          >
            📈 Relatórios
          </button>
          <button
            className={`tab-button ${activeTab === 'configuracoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('configuracoes')}
          >
            ⚙️ Configurações
          </button>
          <button
            className={`tab-button ${activeTab === 'integracoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('integracoes')}
          >
            🔗 Integrações
          </button>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="error-message">{error}</div>}
        {formMessage.type && (
          <div className={`alert-banner ${formMessage.type === 'success' ? 'success' : 'error'}`}>
            {formMessage.text}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stats-card primary">
                <h3>Total de Agendamentos</h3>
                <p className="stats-value">{stats?.totalAppointments || 0}</p>
              </div>
              <div className="stats-card success">
                <h3>Total de Clientes</h3>
                <p className="stats-value">{stats?.totalClients || 0}</p>
              </div>
              <div className="stats-card warning">
                <h3>Receita Total</h3>
                <p className="stats-value">R$ {((stats?.totalRevenue || 0) / 100).toLocaleString('pt-BR')}</p>
              </div>
              <div className="stats-card danger">
                <h3>Agendamentos Pendentes</h3>
                <p className="stats-value">{stats?.pendingAppointments || 0}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agendamentos' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Agendamentos</h2>
              <button className="btn-primary" onClick={() => handleCreate('appointment')} disabled={saving.appointment}>
                {saving.appointment ? 'Salvando...' : '+ Novo Agendamento'}
              </button>
            </div>
            <div className="quick-form">
              <div className="form-grid">
                <label>
                  Cliente
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={newAppointment.client}
                    onChange={(e) => setNewAppointment((prev) => ({ ...prev, client: e.target.value }))}
                  />
                </label>
                <label>
                  Telefone
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={newAppointment.phone}
                    onChange={(e) => setNewAppointment((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </label>
                <label>
                  Serviço
                  <input
                    type="text"
                    placeholder="Serviço"
                    value={newAppointment.service}
                    onChange={(e) => setNewAppointment((prev) => ({ ...prev, service: e.target.value }))}
                  />
                </label>
                <label>
                  Data/Hora
                  <input
                    type="datetime-local"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={newAppointment.status}
                    onChange={(e) => setNewAppointment((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="done">Concluído</option>
                    <option value="canceled">Cancelado</option>
                  </select>
                </label>
              </div>
              <label>
                Observações
                <textarea
                  placeholder="Notas ou instruções"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>
            </div>
            <input
              type="text"
              placeholder="Pesquisar agendamentos..."
              className="search-input"
              value={searchAppointments}
              onChange={(e) => setSearchAppointments(e.target.value)}
            />
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentsList && appointmentsList.length > 0 ? (
                    appointmentsList
                      .filter(a => {
                        if (!a) return false
                        const haystack = [a.client || a.clientName, a.service, a.status, a.date]
                          .map(normalize)
                          .join(' ')
                        return haystack.includes(searchAppointments.toLowerCase())
                      })
                      .map((a, idx) => (
                        <tr key={a?.id || idx}>
                          <td>{a?.client || a?.clientName || '-'}</td>
                          <td>{a?.service || '-'}</td>
                          <td>{formatDate(a?.date)}</td>
                          <td><span className="status-badge">{a?.status || '-'}</span></td>
                          <td>
                            <button className="btn-sm btn-edit">Editar</button>
                            <button className="btn-sm btn-delete" onClick={() => a?.id && handleDeleteItem('appointment', a.id)}>Deletar</button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={5}>Nenhum agendamento encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'clientes' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Clientes</h2>
              <button className="btn-primary" onClick={() => handleCreate('client')} disabled={saving.client}>
                {saving.client ? 'Salvando...' : '+ Novo Cliente'}
              </button>
            </div>
            <div className="quick-form">
              <div className="form-grid">
                <label>
                  Nome
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={newClient.name}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </label>
                <label>
                  Telefone
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={newClient.phone}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    placeholder="cliente@email.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </label>
              </div>
            </div>
            <input
              type="text"
              placeholder="Pesquisar clientes..."
              className="search-input"
              value={searchClients}
              onChange={(e) => setSearchClients(e.target.value)}
            />
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Email</th>
                    <th>Agendamentos</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientsList && clientsList.length > 0 ? (
                    clientsList
                      .filter(c => {
                        if (!c) return false
                        const haystack = [c.name, c.phone, c.email]
                          .map(normalize)
                          .join(' ')
                        return haystack.includes(searchClients.toLowerCase())
                      })
                      .map((c, idx) => (
                        <tr key={c?.id || idx}>
                          <td>{c?.name || '-'}</td>
                          <td>{c?.phone || '-'}</td>
                          <td>{c?.email || '-'}</td>
                          <td>{c?.totalAppointments || 0}</td>
                          <td>
                            <button className="btn-sm btn-edit">Editar</button>
                            <button className="btn-sm btn-delete" onClick={() => c?.id && handleDeleteItem('client', c.id)}>Deletar</button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={5}>Nenhum cliente encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'servicos' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Serviços</h2>
              <button className="btn-primary" onClick={() => handleCreate('service')} disabled={saving.service}>
                {saving.service ? 'Salvando...' : '+ Novo Serviço'}
              </button>
            </div>
            <div className="quick-form">
              <div className="form-grid">
                <label>
                  Nome
                  <input
                    type="text"
                    placeholder="Nome do serviço"
                    value={newService.name}
                    onChange={(e) => setNewService((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </label>
                <label>
                  Preço (R$)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={newService.price}
                    onChange={(e) => setNewService((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </label>
                <label>
                  Duração (min)
                  <input
                    type="number"
                    min="0"
                    placeholder="30"
                    value={newService.duration}
                    onChange={(e) => setNewService((prev) => ({ ...prev, duration: e.target.value }))}
                  />
                </label>
              </div>
              <label>
                Descrição
                <textarea
                  placeholder="Resumo do serviço"
                  value={newService.description}
                  onChange={(e) => setNewService((prev) => ({ ...prev, description: e.target.value }))}
                />
              </label>
            </div>
            <input
              type="text"
              placeholder="Pesquisar serviços..."
              className="search-input"
              value={searchServices}
              onChange={(e) => setSearchServices(e.target.value)}
            />
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Preço</th>
                    <th>Duração (min)</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesList && servicesList.length > 0 ? (
                    servicesList
                      .filter(s => {
                        if (!s) return false
                        const haystack = [s.name, s.description]
                          .map(normalize)
                          .join(' ')
                        const priceStr = ((s?.price || 0) / 100).toLocaleString('pt-BR')
                        return (haystack + ' ' + priceStr).includes(searchServices.toLowerCase())
                      })
                      .map((s, idx) => (
                        <tr key={s?.id || idx}>
                          <td>{s?.name || '-'}</td>
                          <td>R$ {((s?.price || 0) / 100).toLocaleString('pt-BR')}</td>
                          <td>{s?.duration || 0}</td>
                          <td>
                            <button className="btn-sm btn-edit">Editar</button>
                            <button className="btn-sm btn-delete" onClick={() => s?.id && handleDeleteItem('service', s.id)}>Deletar</button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={4}>Nenhum serviço encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'relatorios' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Relatórios</h2>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h3>Receita por Cliente</h3>
                <button className="btn-secondary">Gerar Relatório</button>
              </div>
              <div className="report-card">
                <h3>Serviços Mais Vendidos</h3>
                <button className="btn-secondary">Gerar Relatório</button>
              </div>
              <div className="report-card">
                <h3>Agendamentos por Período</h3>
                <button className="btn-secondary">Gerar Relatório</button>
              </div>
              <div className="report-card">
                <h3>Clientes Inativos</h3>
                <button className="btn-secondary">Gerar Relatório</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'configuracoes' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Configurações</h2>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label>Nome da Empresa</label>
                <input type="text" placeholder="Seu nome ou empresa" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="seu@email.com" />
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input type="tel" placeholder="(11) 99999-9999" />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea placeholder="Descreva seu negócio"></textarea>
              </div>
              <button className="btn-primary">Salvar Configurações</button>
            </div>
          </div>
        )}

        {activeTab === 'integracoes' && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Integrações</h2>
            </div>
            <div className="integrations-grid">
              <div className="integration-card">
                <h3>WhatsApp</h3>
                <p>Integre com WhatsApp para notificações</p>
                <button className="btn-secondary">Conectar</button>
              </div>
              <div className="integration-card">
                <h3>Google Agenda</h3>
                <p>Sincronize com sua agenda do Google</p>
                <button className="btn-secondary">Conectar</button>
              </div>
              <div className="integration-card">
                <h3>Stripe</h3>
                <p>Receba pagamentos online</p>
                <button className="btn-secondary">Conectar</button>
              </div>
              <div className="integration-card">
                <h3>Zoom</h3>
                <p>Crie reuniões automáticas</p>
                <button className="btn-secondary">Conectar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default AdminDashboardNew
