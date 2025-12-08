import { renderHook, act } from '@testing-library/react'
import { useAuth, AuthProvider } from '../src/context/AuthContext'
import React from 'react'

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with authenticated false when no token in localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.plan).toBe('free')
  })

  it('should load token from localStorage on mount', () => {
    const testToken = 'test-token'
    const testUser = { id: '1', email: 'test@example.com', name: 'Test User' }
    
    localStorage.setItem('auth_token', testToken)
    localStorage.setItem('auth_user', JSON.stringify(testUser))
    localStorage.setItem('auth_plan', 'premium')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe(testToken)
    expect(result.current.user).toEqual(testUser)
    expect(result.current.plan).toBe('premium')
  })

  it('should login and save to localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    const testToken = 'new-token'
    const testUser = { id: '2', email: 'new@example.com', name: 'New User' }
    const testPlan = 'premium'

    act(() => {
      result.current.login(testToken, testUser, testPlan)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe(testToken)
    expect(result.current.user).toEqual(testUser)
    expect(result.current.plan).toBe(testPlan)
    
    expect(localStorage.getItem('auth_token')).toBe(testToken)
    expect(localStorage.getItem('auth_user')).toBe(JSON.stringify(testUser))
    expect(localStorage.getItem('auth_plan')).toBe(testPlan)
  })

  it('should logout and clear localStorage', () => {
    localStorage.setItem('auth_token', 'test-token')
    localStorage.setItem('auth_user', JSON.stringify({ id: '1', email: 'test@example.com' }))
    localStorage.setItem('auth_plan', 'premium')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.plan).toBe('free')
    
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('auth_user')).toBeNull()
    expect(localStorage.getItem('auth_plan')).toBeNull()
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.error).toBeTruthy()
    expect((result.error as Error).message).toContain('useAuth must be used within AuthProvider')
  })
})
