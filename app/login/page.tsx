'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { ThemeProvider } from '@/lib/theme-context'
import PasswordInput from '@/components/ui/PasswordInput'
import Turnstile from '@/components/ui/Turnstile'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  const turnstileWaiterRef = useRef<{ resolve: ((token: string) => void) | null }>({ resolve: null })
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

    // Turnstile is only required for login mode
    if (mode === 'login' && !turnstileToken) {
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

      const banRes = await fetch('/api/auth/check-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      })
      const banData = await banRes.json()
      if (banData.banned) {
        setError(banData.permanent ? 'Esta conta foi suspensa permanentemente.' : 'Esta conta está suspensa até ' + new Date(banData.expires_at).toLocaleDateString('pt-PT'))
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
      } catch (err: any) {
        console.error('SignIn error:', err)
      }

      if (!signInResult || signInResult.ok === false) {
        setShowRegisterSuccess(true)
        setLoading(false)
        return
      }

      router.push('/feed')
      return
    }

    const banRes = await fetch('/api/auth/check-ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: values.email }),
    })
    const banData = await banRes.json()
    if (banData.banned) {
      setError(banData.permanent ? 'Esta conta foi suspensa permanentemente.' : 'Esta conta está suspensa até ' + new Date(banData.expires_at).toLocaleDateString('pt-PT'))
      setLoading(false)
      return
    }

    let result
    try {
      result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        turnstileToken,
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
            <Image src="/favicon.png" alt="PORTAL" width={36} height={36} />
            <span>PORTAL</span>
          </div>

          <p className="login-tagline">
            {mode === 'login'
              ? 'O outro mundo espera por ti.'
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

            <button
              type="button"
              className="login-google"
              disabled={mode === 'login' && !turnstileToken}
              onClick={() => {
                setError('')
                signIn('google', { 
                  callbackUrl: '/feed'
                })
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.83 20.42 7.73 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.73 1 3.83 3.58 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {mode === 'login' ? 'Entrar com Google' : 'Registar com Google'}
            </button>

            {mode === 'login' && (
              <>
                <div className="login-divider">
                  <span>ou</span>
                </div>

                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                  onVerify={(token) => {
                    setTurnstileToken(token)
                    turnstileWaiterRef.current.resolve?.(token)
                  }}
                  onExpire={() => setTurnstileToken('')}
                  theme="auto"
                  size="normal"
                  resetSignal={turnstileResetSignal}
                />
              </>
            )}

            {mode === 'register' && (
              <div className="login-divider">
                <span>ou</span>
              </div>
            )}

            <button type="submit" className="login-submit" disabled={loading || (mode === 'login' && !turnstileToken)}>
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

          {showRegisterSuccess && (
            <div className="login-success-modal">
              <div className="login-success-content">
                <div className="login-success-icon">✓</div>
                <h3>Conta criada com sucesso!</h3>
                <p>Podes agora iniciar sessão com as tuas credenciais.</p>
                <button onClick={() => { setShowRegisterSuccess(false); setMode('login'); setValues({ email: '', password: '', confirmPassword: '', username: '', displayName: '' }) }}>
                  Ir para Entrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  )
}
