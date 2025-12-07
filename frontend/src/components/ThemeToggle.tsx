import React from 'react'
import { useTheme } from '../theme/ThemeProvider'

const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme()
  return (
    <button className="btn btn-secondary" onClick={toggle} aria-label="Alternar tema">
      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  )
}

export default ThemeToggle
