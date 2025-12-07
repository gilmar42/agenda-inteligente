import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminTabs from '../components/AdminTabs'
import StatsCard from '../components/StatsCard'
import ChartComponent from '../components/ChartComponent'
import DataTable from '../components/DataTable'
import FormModal from '../components/FormModal'
import ThemeToggle from '../components/ThemeToggle'
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
  const [formModal, setFormModal] = useState<{ isOpen: boolean; type: string; data: any }>({ isOpen: false, type: '', data: null })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [activeTab])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = (type: string) => {
    setFormModal({ isOpen: true, type, data: null })
  }

  const handleEditItem = (type: string, item: any) => {
    setFormModal({ isOpen: true, type, data: item })
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

  const handleFormSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem('token')
      const endpoint = formModal.type === 'appointment' ? 'appointments' : 
                       formModal.type === 'client' ? 'clients' : 'services'
      
      const method = formModal.data ? 'PUT' : 'POST'
      const url = formModal.data 
        ? `${API_URL}/admin/${endpoint}/${formModal.data.id}`
        : `${API_URL}/admin/${endpoint}`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setFormModal({ isOpen: false, type: '', data: null })
        loadDashboardData()
      }
    } catch (err) {
      console.error('Failed to submit form:', err)
    }
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <h1>Painel Administrativo</h1>
          <div className="header-actions">
            <span className="user-info">{user?.name || user?.email}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="admin-content">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : activeTab === 'overview' ? (
          <div className="overview-section">
            <div className="stats-grid">
              <StatsCard
                title="Total de Agendamentos"
                value={data.stats.totalAppointments}
                color="primary"
              />
              <StatsCard
                title="Total de Clientes"
                value={data.stats.totalClients}
                color="success"
              />
              <StatsCard
                title="Receita Total"
                value={`R$ ${data.stats.totalRevenue.toLocaleString('pt-BR')}`}
                color="warning"
              />
              <StatsCard
                title="Agendamentos Pendentes"
                value={data.stats.pendingAppointments}
                color="danger"
              />
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <h3>Receita por Dia</h3>
                <ChartComponent data={data.revenueData} />
              </div>
              <div className="chart-container">
                <h3>Agendamentos por Dia</h3>
                <ChartComponent data={data.appointmentsData} />
              </div>
            </div>
          </div>
        ) : activeTab === 'agendamentos' ? (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Agendamentos</h2>
              <button className="btn-primary" onClick={() => handleAddItem('appointment')}>
                + Novo Agendamento
              </button>
            </div>
            <input
              type="text"
              placeholder="Pesquisar agendamentos..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <DataTable
              columns={['Cliente', 'Serviço', 'Data', 'Status', 'Ações']}
              rows={(data.appointments || []).filter(a => 
                a.client.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(a => ({
                ...a,
                actions: [
                  { label: 'Editar', action: () => handleEditItem('appointment', a) },
                  { label: 'Deletar', action: () => handleDeleteItem('appointment', a.id) }
                ]
              }))}
            />
          </div>
        ) : activeTab === 'clientes' ? (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Clientes</h2>
              <button className="btn-primary" onClick={() => handleAddItem('client')}>
                + Novo Cliente
              </button>
            </div>
            <input
              type="text"
              placeholder="Pesquisar clientes..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <DataTable
              columns={['Nome', 'Telefone', 'Email', 'Agendamentos', 'Ações']}
              rows={(data.clients || []).filter(c => 
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(c => ({
                ...c,
                actions: [
                  { label: 'Editar', action: () => handleEditItem('client', c) },
                  { label: 'Deletar', action: () => handleDeleteItem('client', c.id) }
                ]
              }))}
            />
          </div>
        ) : activeTab === 'servicos' ? (
          <div className="tab-content">
            <div className="tab-header">
              <h2>Serviços</h2>
              <button className="btn-primary" onClick={() => handleAddItem('service')}>
                + Novo Serviço
              </button>
            </div>
            <input
              type="text"
              placeholder="Pesquisar serviços..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <DataTable
              columns={['Nome', 'Preço', 'Duração', 'Ações']}
              rows={(data.services || []).filter(s => 
                s.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(s => ({
                ...s,
                actions: [
                  { label: 'Editar', action: () => handleEditItem('service', s) },
                  { label: 'Deletar', action: () => handleDeleteItem('service', s.id) }
                ]
              }))}
            />
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

      <FormModal
        isOpen={formModal.isOpen}
        type={formModal.type}
        data={formModal.data}
        onClose={() => setFormModal({ isOpen: false, type: '', data: null })}
        onSubmit={handleFormSubmit}
      />
    </main>
  )
}

export default AdminDashboardNew
