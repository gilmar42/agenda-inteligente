import React from 'react'
import ThemeToggle from '../components/ThemeToggle'

const Admin: React.FC = () => (
  <main className="container">
    <header className="header">
      <h2>Admin</h2>
      <ThemeToggle />
    </header>
    <nav className="menu">
      <button disabled>Relatórios (Premium)</button>
      <button disabled>Canais (Premium)</button>
      <button disabled>Pagamentos (Premium)</button>
    </nav>
    <section>
      <p>Esqueleto do Painel Admin com toggle de tema.</p>
    </section>
  </main>
)

export default Admin
