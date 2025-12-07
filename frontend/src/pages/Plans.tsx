import React from 'react'
import Card from '../components/Card'
import Button from '../components/Button'

const Plans: React.FC = () => (
  <main className="container">
    <h2>Planos</h2>
    <div className="grid">
      <Card>
        <h3>Free</h3>
        <ul>
          <li>📅 Agendamentos básicos</li>
          <li>🔔 Notificações limitadas</li>
        </ul>
        <Button onClick={() => (window.location.href = '/login')}>Selecionar</Button>
      </Card>
      <Card>
        <h3>Premium</h3>
        <ul>
          <li>🧠 IA Segment Advisor</li>
          <li>🔔 Notificações ilimitadas</li>
        </ul>
        <Button onClick={() => (window.location.href = '/login')}>Selecionar</Button>
      </Card>
    </div>
  </main>
)

export default Plans
