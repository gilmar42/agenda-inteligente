import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import Input from '../components/Input'
import Button from '../components/Button'
import Card from '../components/Card'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ emailOrPhone: '', password: '' })
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors([])
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoading(true)
    setErrors([])
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        setErrors(data.errors || ['Erro ao autenticar com Google'])
        setLoading(false)
        return
      }

      login(data.token, data.user, data.user.plan || 'free')
      navigate('/admin/dashboard')
    } catch (err) {
      setErrors(['Erro de conexão. Verifique se o backend está rodando.'])
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setErrors(['Erro ao autenticar com Google. Tente novamente.'])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.emailOrPhone || !formData.password) {
      setErrors(['Email/Telefone e senha são obrigatórios'])
      return
    }

    setLoading(true)
    try {
      // Detectar se é email ou telefone
      const isEmail = formData.emailOrPhone.includes('@')
      const payload: any = { password: formData.password }
      
      if (isEmail) {
        payload.email = formData.emailOrPhone
      } else {
        payload.phone = formData.emailOrPhone
      }

      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        setErrors(data.errors || ['Email/telefone ou senha inválidos'])
        setLoading(false)
        return
      }

      login(data.token, data.user, data.user.plan || 'free')
      navigate('/admin/dashboard')
    } catch (err) {
      setErrors(['Erro de conexão. Verifique se o backend está rodando.'])
      setLoading(false)
    }
  }

  return (
    <main className="container">
      <Card>
        <h2>Login</h2>
        <form className="form" onSubmit={handleSubmit}>
          <Input
            type="text"
            name="emailOrPhone"
            placeholder="Email ou telefone"
            value={formData.emailOrPhone}
            onChange={handleChange}
          />
          <Input
            type="password"
            name="password"
            placeholder="Senha"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.length > 0 && (
            <div className="error-box">
              {errors.map((err, i) => (
                <p key={i} className="error">{err}</p>
              ))}
            </div>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          {/* Google OAuth - Oculto por enquanto, funciona apenas com email */}
          {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'seu-client-id.apps.googleusercontent.com' && (
            <>
              <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
                <div style={{ borderTop: '1px solid var(--color-border)', position: 'absolute', width: '100%', top: '50%' }} />
                <span style={{ background: 'var(--color-background)', padding: '0 1rem', position: 'relative', color: 'var(--color-text-secondary)' }}>ou</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signin_with"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                />
              </div>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: '1rem' }}>
            Não tem uma conta? <a href="/signup" style={{ color: 'var(--color-primary)' }}>Cadastre-se</a>
          </p>
        </form>
      </Card>
    </main>
  )
}

export default Login
