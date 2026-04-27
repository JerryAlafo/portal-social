'use client'

import { SessionProvider } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import { ThemeProvider } from '@/lib/theme-context'

function OnboardingInner() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [values, setValues] = useState({
    username: '',
    displayName: '',
  })

  // Load user data from session
  useEffect(() => {
    if (session?.user?.name) {
      setValues((prev) => ({
        ...prev,
        displayName: session.user.name || '',
      }))
    }
  }, [session?.user?.name])

  // Show loading while session is loading
  if (status === 'loading') {
    return (
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
          <p className="login-tagline">Carregando...</p>
        </div>
      </div>
    )
  }

  const handleChange = (field: 'username' | 'displayName', value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: values.username.trim(),
        display_name: values.displayName.trim(),
      }),
    })

    let data = { error: 'Erro ao guardar.' }
    try {
      const text = await response.text()
      if (text) data = JSON.parse(text)
    } catch {
      // ignore parse error
    }

    if (!response.ok) {
      setError(data.error || 'Erro ao guardar.')
      setLoading(false)
      return
    }

    router.push('/feed')
  }

  const handleSkip = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
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

        <h1 className="onboarding-title">Completa o teu perfil</h1>
        <p className="onboarding-desc">
          Escolhe um nome de utilizador único para dares a conhecer na comunidade.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Nome de utilizador</label>
            <input
              className="login-input"
              type="text"
              value={values.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="otakufan99"
              pattern="^[a-zA-Z0-9_]{3,20}$"
              minLength={3}
              maxLength={20}
              required
            />
            <span className="login-hint">3-20 caracteres, letras, números e _</span>
          </div>

          <div className="login-field">
            <label className="login-label">Nome de display</label>
            <input
              className="login-input"
              type="text"
              value={values.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="Otaku Fan"
              maxLength={30}
            />
            <span className="login-hint">O nome que aparece no teu perfil</span>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? <span className="login-spinner" /> : 'Continuar'}
          </button>
        </form>

        <p className="login-footer">
          <button type="button" className="login-switch" onClick={handleSkip}>
            Sair da conta
          </button>
        </p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <OnboardingInner />
      </ThemeProvider>
    </SessionProvider>
  )
}