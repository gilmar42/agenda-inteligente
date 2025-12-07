import React, { useState, useEffect } from 'react'
import AdminTabs from '../components/AdminTabs'
import StatsCard from '../components/StatsCard'
import ChartComponent from '../components/ChartComponent'
import DataTable from '../components/DataTable'
import FormModal from '../components/FormModal'
import ThemeToggle from '../components/ThemeToggle'
import './AdminDashboard.css'

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

const AdminDashboard: React.FC = () => {
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
  const [currentPage, setCurrentPage] = useState(1)
  const [settingsTab, setSettingsTab] = useState('profile')
  const [notificationCount, setNotificationCount] = useState(3)

  useEffect(() => {
    loadDashboardData()
    // Simular notificações em tempo real
    const timer = setInterval(() => {
      setNotificationCount(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1))
    }, 10000)
    
    // Efeito de scroll no header e tabs
    const handleScroll = () => {
      const header = document.querySelector('.admin-header')
      const tabs = document.querySelector('.admin-tabs')
      if (header) {
        if (window.scrollY > 20) {
          header.classList.add('scrolled')
          if (tabs) tabs.classList.add('scrolled')
        } else {
          header.classList.remove('scrolled')
          if (tabs) tabs.classList.remove('scrolled')
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      clearInterval(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      // Mock data
      setData({
        stats: {
          totalAppointments: 24,
          totalClients: 12,
          totalRevenue: 2400,
          pendingAppointments: 3
        },
        revenueData: [
          { label: 'Segunda', value: 300 },
          { label: 'Terça', value: 450 },
          { label: 'Quarta', value: 320 },
          { label: 'Quinta', value: 500 },
          { label: 'Sexta', value: 830 }
        ],
        appointmentsData: [
          { label: 'Realizados', value: 18 },
          { label: 'Pendentes', value: 3 },
          { label: 'Cancelados', value: 3 }
        ],
        appointments: [
          { id: '1', client: 'João Silva', service: 'Cabelo', date: '2025-12-07', status: 'pending' },
          { id: '2', client: 'Maria Santos', service: 'Barba', date: '2025-12-08', status: 'completed' },
          { id: '3', client: 'Pedro Costa', service: 'Corte Completo', date: '2025-12-09', status: 'pending' }
        ],
        clients: [
          { id: '1', name: 'João Silva', phone: '11999999999', email: 'joao@example.com', totalAppointments: 5 },
          { id: '2', name: 'Maria Santos', phone: '11988888888', email: 'maria@example.com', totalAppointments: 3 }
        ],
        services: [
          { id: '1', name: 'Corte Cabelo', price: 50, duration: 30 },
          { id: '2', name: 'Barba', price: 30, duration: 20 },
          { id: '3', name: 'Corte Completo', price: 70, duration: 45 }
        ]
      })
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
    try {
      const token = localStorage.getItem('token')
      const endpoint =
        type === 'appointment'
          ? `/admin/appointments/${id}`
          : type === 'client'
            ? `/admin/clients/${id}`
            : `/admin/services/${id}`

      await fetch(`http://localhost:3001${endpoint}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      loadDashboardData()
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  const handleFormSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem('token')
      const isEdit = formModal.data ? formModal.data.id : null

      const method = isEdit ? 'PUT' : 'POST'
      const endpoint =
        formModal.type === 'appointment'
          ? isEdit
            ? `/admin/appointments/${isEdit}`
            : '/admin/appointments'
          : formModal.type === 'client'
            ? isEdit
              ? `/admin/clients/${isEdit}`
              : '/admin/clients'
            : isEdit
              ? `/admin/services/${isEdit}`
              : '/admin/services'

      await fetch(`http://localhost:3001${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      })

      setFormModal({ isOpen: false, type: '', data: null })
      loadDashboardData()
    } catch (err) {
      throw err
    }
  }

  const handleExportData = async (format: 'csv' | 'pdf') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/admin/reports/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao exportar: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      console.log(`Arquivo exportado com sucesso: relatorio.${format}`)
    } catch (err) {
      console.error('Failed to export:', err)
      alert(`Erro ao exportar arquivo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    }
  }

  const handleSaveSettings = async (tab: string, formData: any) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:3001/admin/settings/${tab}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      alert('Configurações salvas!')
    } catch (err) {
      alert('Erro ao salvar')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'Agendamentos', icon: '📅', badge: data.stats.pendingAppointments },
    { id: 'clients', label: 'Clientes', icon: '👥', badge: data.stats.totalClients },
    { id: 'services', label: 'Serviços', icon: '✂️' },
    { id: 'reports', label: 'Relatórios', icon: '📈' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' },
    { id: 'integrations', label: 'Integrações', icon: '🔗' }
  ]

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>Painel Administrativo</h1>
          <p>Gerencie seu negócio em um único lugar</p>
        </div>
        <div className="header-actions">
          <div className="notifications">
            <button className="notification-bell">
              🔔
              {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
            </button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <AdminTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <section className="tab-content overview-content">
          {/* Cards estatísticos principais */}
          <div className="stats-grid">
            <StatsCard
              title="Agendamentos"
              value={data.stats.totalAppointments}
              icon="📅"
              color="primary"
              trend={{ direction: 'up', percentage: 12 }}
            />
            <StatsCard
              title="Clientes"
              value={data.stats.totalClients}
              icon="👥"
              color="success"
              trend={{ direction: 'up', percentage: 8 }}
            />
            <StatsCard
              title="Receita"
              value={`R$ ${(data.stats.totalRevenue / 100).toFixed(2)}`}
              icon="💰"
              color="warning"
              trend={{ direction: 'up', percentage: 15 }}
            />
            <StatsCard
              title="Pendentes"
              value={data.stats.pendingAppointments}
              icon="⏳"
              color="danger"
            />
          </div>

          <div className="charts-grid">
            <ChartComponent title="Receita Semanal" type="bar" data={data.revenueData} color="#3498db" />
            <ChartComponent title="Status Agendamentos" type="pie" data={data.appointmentsData} color="#2ecc71" />
          </div>

          <div className="quick-actions">
            <h3>Ações Rápidas</h3>
            <div className="actions-grid">
              <button className="action-card" onClick={() => handleAddItem('appointment')}>
                <span className="action-icon">📅</span>
                <span className="action-label">Novo Agendamento</span>
              </button>
              <button className="action-card" onClick={() => handleAddItem('client')}>
                <span className="action-icon">👥</span>
                <span className="action-label">Novo Cliente</span>
              </button>
              <button className="action-card" onClick={() => handleAddItem('service')}>
                <span className="action-icon">✂️</span>
                <span className="action-label">Novo Serviço</span>
              </button>
              <button className="action-card" onClick={() => setActiveTab('reports')}>
                <span className="action-icon">📈</span>
                <span className="action-label">Ver Relatórios</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <section className="tab-content">
          <div className="content-header">
            <h2>Gerenciar Agendamentos</h2>
            <button className="btn-add" onClick={() => handleAddItem('appointment')}>
              + Novo Agendamento
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'client' as const, label: 'Cliente', sortable: true },
              { key: 'service' as const, label: 'Serviço', sortable: true },
              { key: 'date' as const, label: 'Data', sortable: true },
              {
                key: 'status' as const,
                label: 'Status',
                render: (value) => (
                  <span className={`status-badge status-${value}`}>{value === 'pending' ? 'Pendente' : 'Concluído'}</span>
                )
              },
              { key: 'actions' as const, label: 'Ações', width: '150px' }
            ]}
            data={data.appointments}
            loading={loading}
            searchValue={searchQuery}
            onSearch={setSearchQuery}
            onEdit={(row) => handleEditItem('appointment', row)}
            onDelete={(id) => handleDeleteItem('appointment', String(id))}
            pagination={{ page: currentPage, pageSize: 10, total: data.appointments.length }}
            onPageChange={setCurrentPage}
          />
        </section>
      )}

      {/* CLIENTS */}
      {activeTab === 'clients' && (
        <section className="tab-content">
          <div className="content-header">
            <h2>Gerenciar Clientes</h2>
            <button className="btn-add" onClick={() => handleAddItem('client')}>
              + Novo Cliente
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'name' as const, label: 'Nome', sortable: true },
              { key: 'phone' as const, label: 'Telefone' },
              { key: 'email' as const, label: 'Email' },
              { key: 'totalAppointments' as const, label: 'Agendamentos', align: 'center' },
              { key: 'actions' as const, label: 'Ações', width: '150px' }
            ]}
            data={data.clients}
            loading={loading}
            searchValue={searchQuery}
            onSearch={setSearchQuery}
            onEdit={(row) => handleEditItem('client', row)}
            onDelete={(id) => handleDeleteItem('client', String(id))}
          />
        </section>
      )}

      {/* SERVICES */}
      {activeTab === 'services' && (
        <section className="tab-content">
          <div className="content-header">
            <h2>Gerenciar Serviços</h2>
            <button className="btn-add" onClick={() => handleAddItem('service')}>
              + Novo Serviço
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'name' as const, label: 'Serviço', sortable: true },
              { key: 'price' as const, label: 'Preço', render: (v) => `R$ ${(Number(v) / 100).toFixed(2)}` },
              { key: 'duration' as const, label: 'Duração (min)' },
              { key: 'actions' as const, label: 'Ações', width: '150px' }
            ]}
            data={data.services}
            loading={loading}
            onEdit={(row) => handleEditItem('service', row)}
            onDelete={(id) => handleDeleteItem('service', String(id))}
          />
        </section>
      )}

      {/* REPORTS */}
      {activeTab === 'reports' && (
        <section className="tab-content reports-content">
          <h2>Relatórios e Analytics</h2>
          <p className="subtitle-text">Visualize métricas detalhadas do seu negócio</p>

          <div className="reports-grid">
            <div className="report-card">
              <h3>📈 Crescimento</h3>
              <p className="metric">+32%</p>
              <p className="subtitle">Comparado ao mês anterior</p>
            </div>
            <div className="report-card">
              <h3>⭐ Satisfação</h3>
              <p className="metric">4.8/5</p>
              <p className="subtitle">Baseado em 45 avaliações</p>
            </div>
            <div className="report-card">
              <h3>📊 Taxa de Retorno</h3>
              <p className="metric">73%</p>
              <p className="subtitle">Clientes que voltam</p>
            </div>
            <div className="report-card">
              <h3>💼 Ticket Médio</h3>
              <p className="metric">R$ 85,50</p>
              <p className="subtitle">Por agendamento</p>
            </div>
          </div>

          <div className="charts-grid">
            <ChartComponent
              title="Receita por Mês"
              type="line"
              data={[
                { label: 'Janeiro', value: 2500 },
                { label: 'Fevereiro', value: 3200 },
                { label: 'Março', value: 2800 },
                { label: 'Abril', value: 4100 },
                { label: 'Maio', value: 3900 }
              ]}
              color="#e74c3c"
            />
            <ChartComponent
              title="Serviços Mais Procurados"
              type="bar"
              data={[
                { label: 'Corte Cabelo', value: 45 },
                { label: 'Barba', value: 32 },
                { label: 'Corte Completo', value: 28 }
              ]}
              color="#2ecc71"
            />
          </div>

          <div className="back-button-container">
            <button className="btn-back" onClick={() => setActiveTab('overview')}>
              ← Voltar ao Início
            </button>
          </div>

          <div className="export-section">
            <h3>Exportar Dados</h3>
            <div className="export-buttons">
              <button className="btn-export" onClick={() => handleExportData('csv')}>📊 Exportar CSV</button>
              <button className="btn-export" onClick={() => handleExportData('pdf')}>📄 Exportar PDF</button>
              <button className="btn-export" onClick={() => alert('Funcionalidade em breve')}>📧 Enviar por Email</button>
            </div>
          </div>
        </section>
      )}

      {/* SETTINGS */}
      {activeTab === 'settings' && (
        <section className="tab-content settings-content">
          <h2>Configurações</h2>

          <div className="settings-tabs">
            <button
              className={`settings-tab ${settingsTab === 'profile' ? 'active' : ''}`}
              onClick={() => setSettingsTab('profile')}
            >
              👤 Perfil
            </button>
            <button
              className={`settings-tab ${settingsTab === 'business' ? 'active' : ''}`}
              onClick={() => setSettingsTab('business')}
            >
              🏢 Negócio
            </button>
            <button
              className={`settings-tab ${settingsTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setSettingsTab('notifications')}
            >
              🔔 Notificações
            </button>
            <button
              className={`settings-tab ${settingsTab === 'security' ? 'active' : ''}`}
              onClick={() => setSettingsTab('security')}
            >
              🔒 Segurança
            </button>
          </div>

          <div className="settings-panel">
            {settingsTab === 'profile' && (
              <div className="settings-form">
                <h3>Perfil do Profissional</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleSaveSettings('profile', Object.fromEntries(formData))
                }}>
                  <div className="form-group">
                    <label>Nome Completo</label>
                    <input type="text" name="name" placeholder="Seu nome" required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="seu@email.com" required />
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input type="tel" name="phone" placeholder="(11) 99999-9999" required />
                  </div>
                  <button type="submit" className="btn-save">💾 Salvar Alterações</button>
                </form>
              </div>
            )}

            {settingsTab === 'business' && (
              <div className="settings-form">
                <h3>Informações do Negócio</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleSaveSettings('business', Object.fromEntries(formData))
                }}>
                  <div className="form-group">
                    <label>Nome da Empresa</label>
                    <input type="text" name="businessName" placeholder="Seu salão/barbearia" required />
                  </div>
                  <div className="form-group">
                    <label>Descrição</label>
                    <textarea name="description" placeholder="Descrição do seu negócio" required></textarea>
                  </div>
                  <div className="form-group">
                    <label>Endereço</label>
                    <input type="text" name="address" placeholder="Rua, número - Cidade" required />
                  </div>
                  <div className="form-group">
                    <label>Horário de Funcionamento</label>
                    <div className="time-inputs">
                      <input type="time" name="openTime" placeholder="Abertura" required />
                      <span>-</span>
                      <input type="time" name="closeTime" placeholder="Fechamento" required />
                    </div>
                  </div>
                  <button type="submit" className="btn-save">💾 Salvar Alterações</button>
                </form>
              </div>
            )}

            {settingsTab === 'notifications' && (
              <div className="settings-form">
                <h3>Preferências de Notificações</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const settings = {
                    newAppointments: formData.get('newAppointments') === 'on',
                    canceledAppointments: formData.get('canceledAppointments') === 'on',
                    clientReminders: formData.get('clientReminders') === 'on',
                    promotions: formData.get('promotions') === 'on'
                  }
                  handleSaveSettings('notifications', settings)
                }}>
                  <div className="checkbox-group">
                    <label>
                      <input type="checkbox" name="newAppointments" defaultChecked /> Novos agendamentos
                    </label>
                  </div>
                  <div className="checkbox-group">
                    <label>
                      <input type="checkbox" name="canceledAppointments" defaultChecked /> Agendamentos cancelados
                    </label>
                  </div>
                  <div className="checkbox-group">
                    <label>
                      <input type="checkbox" name="clientReminders" defaultChecked /> Lembretes de clientes
                    </label>
                  </div>
                  <div className="checkbox-group">
                    <label>
                      <input type="checkbox" name="promotions" /> Promoções e novidades
                    </label>
                  </div>
                  <button type="submit" className="btn-save">💾 Salvar Preferências</button>
                </form>
              </div>
            )}

            {settingsTab === 'security' && (
              <div className="settings-form">
                <h3>Segurança</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const newPassword = formData.get('newPassword')
                  const confirmPassword = formData.get('confirmPassword')
                  
                  if (newPassword !== confirmPassword) {
                    alert('As senhas não coincidem!')
                    return
                  }
                  
                  handleSaveSettings('security', {
                    currentPassword: formData.get('currentPassword'),
                    newPassword: formData.get('newPassword')
                  })
                }}>
                  <div className="form-group">
                    <label>Senha Atual</label>
                    <input type="password" name="currentPassword" placeholder="Digite sua senha" required />
                  </div>
                  <div className="form-group">
                    <label>Nova Senha</label>
                    <input type="password" name="newPassword" placeholder="Digite a nova senha" required minLength={6} />
                  </div>
                  <div className="form-group">
                    <label>Confirmar Senha</label>
                    <input type="password" name="confirmPassword" placeholder="Confirme a nova senha" required minLength={6} />
                  </div>
                  <button type="submit" className="btn-save">🔐 Alterar Senha</button>
                </form>
              </div>
            )}
          </div>
        </section>
      )}

      {/* INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <section className="tab-content integrations-content">
          <h2>Integrações</h2>

          <div className="integrations-grid">
            <div className="integration-card">
              <div className="integration-header">
                <h3>💬 WhatsApp</h3>
                <span className="status-badge status-pending">Desativado</span>
              </div>
              <p>Envie confirmações e lembretes via WhatsApp</p>
              <button className="btn-integrate">Conectar WhatsApp</button>
            </div>

            <div className="integration-card">
              <div className="integration-header">
                <h3>💳 Pix</h3>
                <span className="status-badge status-pending">Desativado</span>
              </div>
              <p>Receba pagamentos via Pix diretamente na plataforma</p>
              <button className="btn-integrate">Configurar Pix</button>
            </div>

            <div className="integration-card">
              <div className="integration-header">
                <h3>📱 Google Calendar</h3>
                <span className="status-badge status-pending">Desativado</span>
              </div>
              <p>Sincronize agendamentos com Google Calendar</p>
              <button className="btn-integrate">Conectar Google</button>
            </div>

            <div className="integration-card">
              <div className="integration-header">
                <h3>📧 Email Marketing</h3>
                <span className="status-badge status-pending">Desativado</span>
              </div>
              <p>Envie campanhas de email para seus clientes</p>
              <button className="btn-integrate">Configurar Email</button>
            </div>

            <div className="integration-card">
              <div className="integration-header">
                <h3>📊 Google Analytics</h3>
                <span className="status-badge status-pending">Desativado</span>
              </div>
              <p>Monitore estatísticas detalhadas do seu negócio</p>
              <button className="btn-integrate">Conectar Analytics</button>
            </div>

            <div className="integration-card">
              <div className="integration-header">
                <h3>💰 Stripe</h3>
                <span className="status-badge status-pending">Desativado</span>
              </div>
              <p>Integre pagamentos internacionais via Stripe</p>
              <button className="btn-integrate">Configurar Stripe</button>
            </div>
          </div>
        </section>
      )}

      {/* FORM MODALS */}
      <FormModal
        isOpen={formModal.isOpen}
        title={`${formModal.data ? 'Editar' : 'Novo'} ${formModal.type === 'appointment' ? 'Agendamento' : formModal.type === 'client' ? 'Cliente' : 'Serviço'}`}
        fields={
          formModal.type === 'appointment'
            ? [
                { name: 'clientName', label: 'Cliente', type: 'text', required: true },
                { name: 'phone', label: 'Telefone', type: 'phone' },
                { name: 'service', label: 'Serviço', type: 'text', required: true },
                { name: 'date', label: 'Data/Hora', type: 'date', required: true },
                { name: 'notes', label: 'Notas', type: 'textarea' }
              ]
            : formModal.type === 'client'
              ? [
                  { name: 'name', label: 'Nome', type: 'text', required: true },
                  { name: 'email', label: 'Email', type: 'email' },
                  { name: 'phone', label: 'Telefone', type: 'phone', required: true }
                ]
              : [
                  { name: 'name', label: 'Nome do Serviço', type: 'text', required: true },
                  { name: 'price', label: 'Preço (R$)', type: 'number', required: true },
                  { name: 'duration', label: 'Duração (minutos)', type: 'number', required: true }
                ]
        }
        initialValues={formModal.data || {}}
        onSubmit={handleFormSubmit}
        onClose={() => setFormModal({ isOpen: false, type: '', data: null })}
      />
    </main>
  )
}

export default AdminDashboard
