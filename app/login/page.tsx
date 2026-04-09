'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeProvider } from '@/lib/theme-context'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => router.push('/feed'), 1200)
  }

  return (
    <ThemeProvider>
      <div className={styles.page}>
        <div className={styles.bg}>
          <div className={styles.blob1} />
          <div className={styles.blob2} />
          <div className={styles.blob3} />
        </div>

        <div className={styles.card}>
          <div className={styles.logo}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#7c5cfc" opacity="0.2"/>
              <circle cx="16" cy="16" r="14" stroke="#7c5cfc" strokeWidth="1.5"/>
              <path d="M10 12L16 8L22 12V20L16 24L10 20V12Z" stroke="#9b7fff" strokeWidth="1.5" fill="rgba(124,92,252,0.25)"/>
              <circle cx="16" cy="16" r="3" fill="#9b7fff"/>
            </svg>
            <span>PORTAL</span>
          </div>

          <p className={styles.tagline}>
            {mode === 'login'
              ? 'Bem-vindo de volta, otaku.'
              : 'Junta-te a maior comunidade de anime.'}
          </p>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
              onClick={() => setMode('login')}
            >
              Entrar
            </button>
            <button
              className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
              onClick={() => setMode('register')}
            >
              Registar
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Nome de utilizador</label>
                  <input className={styles.input} type="text" placeholder="otakufan99" required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Nome de display</label>
                  <input className={styles.input} type="text" placeholder="Otaku Fan" required />
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" placeholder="eu@portal.pt" required />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input className={styles.input} type="password" placeholder="••••••••" required />
            </div>

            {mode === 'register' && (
              <div className={styles.field}>
                <label className={styles.label}>Confirmar password</label>
                <input className={styles.input} type="password" placeholder="••••••••" required />
              </div>
            )}

            {mode === 'login' && (
              <div className={styles.forgotRow}>
                <a href="#" className={styles.forgot}>Esqueceu a password?</a>
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                mode === 'login' ? 'Entrar no PORTAL' : 'Criar conta'
              )}
            </button>
          </form>

          {mode === 'login' && (
            <p className={styles.footer}>
              Ainda nao tens conta?{' '}
              <button className={styles.switchBtn} onClick={() => setMode('register')}>
                Regista-te
              </button>
            </p>
          )}
        </div>
      </div>
    </ThemeProvider>
  )
}
