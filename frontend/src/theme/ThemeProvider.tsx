import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext<{ theme: 'light' | 'dark'; toggle: () => void }>({ theme: 'light', toggle: () => {} })

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark')
  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))
  useEffect(() => { localStorage.setItem('theme', theme); document.documentElement.dataset.theme = theme }, [theme])
  const value = useMemo(() => ({ theme, toggle }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
