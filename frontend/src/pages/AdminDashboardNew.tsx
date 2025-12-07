import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './AdminDashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface DashboardData {
  stats: {
    totalAppointments: number
    totalClients: number
    totalRevenue: number
    pendingAppointments: number
  }
  revenueData: Array<{ label: string; value: number }>
  appointmentsData: Array<{ label: string; value: number }>
  appointments: Array<{ id: string; client: string; service: string; date: string; status: string }>
  clients: Array<{ id: string; name: string; phone: string; email: string; totalAppointments: number }>
  services: Array<{ id: string; name: string; price: number; duration: number }>
}

const AdminDashboardNew: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState<DashboardData>({
    stats: { totalAppointments: 0, totalClients: 0, totalRevenue: 0, pendingAppointments: 0 },
    revenueData: [],
    appointmentsData: [],
    appointments: [],
    clients: [],
    services: []
  })

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [activeTab])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
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
        setData(result || {
          stats: { totalAppointments: 0, totalClients: 0, totalRevenue: 0, pendingAppointments: 0 },
          revenueData: [],
          appointmentsData: [],
          appointments: [],
          clients: [],
          services: []
        })
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setData({
        stats: { totalAppointments: 0, totalClients: 0, totalRevenue: 0, pendingAppointments: 0 },
        revenueData: [],
        appointmentsData: [],
        appointments: [],
        clients: [],
        services: []
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (type: string, id: string) => {
    if (!window.confirm('Tem certeza que deseja deletar?')) return
    
    try {
      const token = localStorage.getItem('token')
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

  const appointmentsToShow = Array.isArray(data?.appointments) ? data.appointments : []
  const clientsToShow = Array.isArray(data?.clients) ? data.clients : []
  const servicesToShow = Array.isArray(data?.services) ? data.services : []

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <h1>Painel Administrativo</h1>
          <div className="header-actions">
            <span className="user-info">{user?.name || user?.email}</span>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="admin-tabs">
        <div className="tabs-container">
          {['overview', 'agendamentos', 'clientes', 'servicos', 'relatorios', 'configuracoes', 'integracoes'].map(tab => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' && '📊 Visão Geral'}
              {tab === 'agendamentos' && '📅 Agendamentos'}
              {tab === 'clientes' && '👥 Clientes'}
              {tab === 'servicos' && '🛠️ Serviços'}
              {tab === 'relatorios' && '📈 Relatórios'}
              {tab === 'configuracoes' && '⚙️ Configurações'}
              {tab === 'integracoes' && '🔗 Integrações'}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : activeTab === 'overview' ? (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stats-card primary">
                <h3>Total de Agendamentos</h3>
                <p className="stats-value">{data?.stats?.totalAppointments || 0}</p>
              </div>
              <div className="stats-card success">
                <h3>Total de Clientes</h3>
                <p className="stats-value">{data?.stats?.totalClients || 0}</p>
              </div>
              <div className="stats-card warning">
                <h3>Receita Total</h3>
                <p className="stats-value">R$ {((data?.stats?.totalRevenue || 0) / 100).toLocaleString('pt-BR')}</p>
              </div>
              <div className="stats-card danger">
                <h3>Agendamentos Pendentes</h3>
                <p className="stats-value">{data?.stats?.pendingAppointments || 0}</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'agendamentos' ? (
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
                  {appointmentsToShow
                    .filter(a => a?.client?.toLowerCase?.()?.includes(searchQuery.toLowerCase()))
                    .map(a => (
                      <tr key={a?.id}>
                        <td>{a?.client}</td>
                        <td>{a?.service}</td>
                        <td>{a?.date}</td>
                        <td><span className="status-badge">{a?.status}</span></td>
                        <td>
                          <button className="btn-sm btn-edit">Editar</button>
                          <button className="btn-sm btn-delete" onClick={() => handleDeleteItem('appointment', a?.id)}>Deletar</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'clientes' ? (
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
                  {clientsToShow
                    .filter(c => c?.name?.toLowerCase?.()?.includes(searchQuery.toLowerCase()))
                    .map(c => (
                      <tr key={c?.id}>
                        <td>{c?.name}</td>
                        <td>{c?.phone}</td>
                        <td>{c?.email}</td>
                        <td>{c?.totalAppointments}</td>
                        <td>
                          <button className="btn-sm btn-edit">Editar</button>
                          <button className="btn-sm btn-delete" onClick={() => handleDeleteItem('client', c?.id)}>Deletar</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'servicos' ? (
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
                  {servicesToShow
                    .filter(s => s?.name?.toLowerCase?.()?.includes(searchQuery.toLowerCase()))
                    .map(s => (
                      <tr key={s?.id}>
                        <td>{s?.name}</td>
                        <td>R$ {((s?.price || 0) / 100).toLocaleString('pt-BR')}</td>
                        <td>{s?.duration}</td>
                        <td>
                          <button className="btn-sm btn-edit">Editar</button>
                          <button className="btn-sm btn-delete" onClick={() => handleDeleteItem('service', s?.id)}>Deletar</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'relatorios' ? (
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
        ) : activeTab === 'configuracoes' ? (
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
        ) : activeTab === 'integracoes' ? (
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
        ) : null}
      </div>
    </main>
  )
}

export default AdminDashboardNew
