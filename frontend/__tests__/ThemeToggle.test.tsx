import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../src/theme/ThemeProvider'
import ThemeToggle from '../src/components/ThemeToggle'

test('renders and toggles theme', () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  )
  const btn = screen.getByRole('button', { name: /Alternar tema/i })
  expect(btn).toBeInTheDocument()
  const before = document.documentElement.dataset.theme
  fireEvent.click(btn)
  const after = document.documentElement.dataset.theme
  expect(after).not.toEqual(before)
})
