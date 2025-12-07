import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './AdminDashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const AdminDashboardNew: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalClients: 0,
    totalRevenue: 0,
    pendingAppointments: 0
  })
  const [appointments, setAppointments] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

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

      const response = await fetch(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        const result = await response.json()
        setStats(result?.stats || {
          totalAppointments: 0,
          totalClients: 0,
          totalRevenue: 0,
          pendingAppointments: 0
        })
        setAppointments(result?.appointments || [])
        setClients(result?.clients || [])
        setServices(result?.services || [])
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
              <button className="btn-primary">+ Novo Agendamento</button>
            </div>
            <input
              type="text"
              placeholder="Pesquisar agendamentos..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                        if (!a || !a.client) return false
                        return a.client.toString().toLowerCase().includes(searchQuery.toLowerCase())
                      })
                      .map((a, idx) => (
                        <tr key={a?.id || idx}>
                          <td>{a?.client || '-'}</td>
                          <td>{a?.service || '-'}</td>
                          <td>{a?.date || '-'}</td>
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
              <button className="btn-primary">+ Novo Cliente</button>
            </div>
            <input
              type="text"
              placeholder="Pesquisar clientes..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                        if (!c || !c.name) return false
                        return c.name.toString().toLowerCase().includes(searchQuery.toLowerCase())
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
              <button className="btn-primary">+ Novo Serviço</button>
            </div>
            <input
              type="text"
              placeholder="Pesquisar serviços..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                        if (!s || !s.name) return false
                        return s.name.toString().toLowerCase().includes(searchQuery.toLowerCase())
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
