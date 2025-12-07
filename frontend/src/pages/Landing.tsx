import React from 'react'
import Button from '../components/Button'
import ThemeToggle from '../components/ThemeToggle'

const Landing: React.FC = () => (
  <main className="container">
    <header className="header">
      <h1>Agenda Inteligente</h1>
      <ThemeToggle />
    </header>
    <section className="hero">
      <h2>Organize sua agenda com IA</h2>
      <p>Otimize agendamentos, pagamentos e comunicação com uma plataforma moderna.</p>
      <Button onClick={() => (window.location.href = '/plans')}>COMECE AGORA</Button>
    </section>
    <section className="video-placeholder">Vídeo de Valor (em breve)</section>
  </main>
)

export default Landing
