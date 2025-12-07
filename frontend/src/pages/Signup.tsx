import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import Input from '../components/Input'
import Button from '../components/Button'
import Card from '../components/Card'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const Signup: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors([])
  }

  const validateForm = () => {
    const errs: string[] = []
    if (!formData.name || formData.name.length < 2) {
      errs.push('Nome deve ter pelo menos 2 caracteres')
    }
    if (!formData.email && !formData.phone) {
      errs.push('Informe email ou telefone')
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.push('Email inválido')
    }
    if (formData.phone && !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errs.push('Telefone inválido (formato: +5511999999999)')
    }
    if (!formData.password || formData.password.length < 8) {
      errs.push('Senha deve ter pelo menos 8 caracteres')
    }
    if (formData.password !== formData.confirmPassword) {
      errs.push('Senhas não conferem')
    }
    return errs
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoading(true)
    setErrors([])
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        setErrors(data.errors || ['Erro ao autenticar com Google'])
        setLoading(false)
        return
      }

      login(data.token, data.user, 'free')
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
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const payload: any = { password: formData.password }
      if (formData.name) payload.name = formData.name
      if (formData.email) payload.email = formData.email
      if (formData.phone) payload.phone = formData.phone.replace(/\s/g, '')

      const res = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        setErrors(data.errors || ['Erro ao cadastrar'])
        setLoading(false)
        return
      }

      login(data.token, data.user, 'free')
      navigate('/admin/dashboard')
    } catch (err) {
      setErrors(['Erro de conexão. Verifique se o backend está rodando.'])
      setLoading(false)
    }
  }

  return (
    <main className="container">
      <Card>
        <h2>Cadastro</h2>
        <form className="form" onSubmit={handleSubmit}>
          <Input
            type="text"
            name="name"
            placeholder="Nome completo"
            value={formData.name}
            onChange={handleChange}
          />
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            type="tel"
            name="phone"
            placeholder="Telefone (ex: +5511999999999)"
            value={formData.phone}
            onChange={handleChange}
          />
          <Input
            type="password"
            name="password"
            placeholder="Senha (mínimo 8 caracteres)"
            value={formData.password}
            onChange={handleChange}
          />
          <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar senha"
            value={formData.confirmPassword}
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
            {loading ? 'Cadastrando...' : 'Cadastrar'}
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
                  text="signup_with"
                  shape="rectangular"
                  theme="outline"
                  size="large"
                />
              </div>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: '1rem' }}>
            Já tem uma conta? <a href="/login" style={{ color: 'var(--color-primary)' }}>Faça login</a>
          </p>
        </form>
      </Card>
    </main>
  )
}

export default Signup
