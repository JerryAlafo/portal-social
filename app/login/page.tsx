'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ThemeProvider } from '@/lib/theme-context'
import PasswordInput from '@/components/ui/PasswordInput'
import Turnstile from '@/components/ui/Turnstile'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [values, setValues] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
  })

  const handleChange = (field: keyof typeof values, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!turnstileToken) {
      setError('Por favor, verifica que não és um robô.')
      setLoading(false)
      return
    }

    if (mode === 'register') {
      if (values.password !== values.confirmPassword) {
        setError('As passwords não coincidem.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          username: values.username.trim(),
          display_name: values.displayName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta.')
        setLoading(false)
        return
      }

      let signInResult
      try {
        signInResult = await signIn('credentials', {
          redirect: false,
          email: values.email,
          password: values.password,
        })
      } catch {
        setError('Erro ao autenticar após registo.')
        setLoading(false)
        return
      }

      if (!signInResult || signInResult.error || signInResult.ok === false) {
        setError('Erro ao autenticar após registo.')
        setLoading(false)
        return
      }

      router.push('/feed')
      return
    }

    let result
    try {
      result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      })
    } catch {
      setError('Credenciais inválidas.')
      setLoading(false)
      return
    }

    if (!result || result.error || result.ok === false) {
      setError('Credenciais inválidas.')
      setLoading(false)
      return
    }

    router.push('/feed')
  }

  return (
    <ThemeProvider>
      <div className="login-page">
        <div className="login-bg">
          <div className="login-blob login-blob1" />
          <div className="login-blob login-blob2" />
          <div className="login-blob login-blob3" />
        </div>

        <div className="login-card">
          <div className="login-logo">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#7c5cfc" opacity="0.2" />
              <circle cx="16" cy="16" r="14" stroke="#7c5cfc" strokeWidth="1.5" />
              <path
                d="M10 12L16 8L22 12V20L16 24L10 20V12Z"
                stroke="#9b7fff"
                strokeWidth="1.5"
                fill="rgba(124,92,252,0.25)"
              />
              <circle cx="16" cy="16" r="3" fill="#9b7fff" />
            </svg>
            <span>PORTAL</span>
          </div>

          <p className="login-tagline">
            {mode === 'login'
              ? 'Bem-vindo de volta, otaku.'
              : 'Junta-te a maior comunidade de anime.'}
          </p>

          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${mode === 'login' ? 'login-tab-active' : ''}`}
              onClick={() => setMode('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`login-tab ${mode === 'register' ? 'login-tab-active' : ''}`}
              onClick={() => setMode('register')}
            >
              Registar
            </button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="login-field-row">
                <div className="login-field">
                  <label className="login-label">Nome de utilizador</label>
                  <input
                    className="login-input"
                    type="text"
                    value={values.username}
                    onChange={(event) => handleChange('username', event.target.value)}
                    placeholder="otakufan99"
                    required
                  />
                </div>
                <div className="login-field">
                  <label className="login-label">Nome de display</label>
                  <input
                    className="login-input"
                    type="text"
                    value={values.displayName}
                    onChange={(event) => handleChange('displayName', event.target.value)}
                    placeholder="Otaku Fan"
                    required
                  />
                </div>
              </div>
            )}

            <div className="login-field">
              <label className="login-label">Email</label>
              <input
                className="login-input"
                type="email"
                value={values.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="eu@portal.pt"
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <PasswordInput
                value={values.password}
                onChange={(v) => handleChange('password', v)}
                required
              />
            </div>

            {mode === 'register' && (
              <div className="login-field">
                <label className="login-label">Confirmar password</label>
                <PasswordInput
                  value={values.confirmPassword}
                  onChange={(v) => handleChange('confirmPassword', v)}
                  required
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="login-forgot-row">
                <a href="#" className="login-forgot">Esqueceu a password?</a>
              </div>
            )}

            {error && <p className="login-error">{error}</p>}

            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken('')}
              theme="auto"
              size="flexible"
            />

            <button type="submit" className="login-submit" disabled={loading || !turnstileToken}>
              {loading ? (
                <span className="login-spinner" />
              ) : mode === 'login' ? (
                'Entrar no PORTAL'
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          {mode === 'login' && (
            <p className="login-footer">
              Ainda não tens conta?{' '}
              <button type="button" className="login-switch" onClick={() => setMode('register')}>
                Regista-te
              </button>
            </p>
          )}
        </div>
      </div>
    </ThemeProvider>
  )
}
