'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'

export default function BannedPage() {
  useEffect(() => {
    signOut({ callbackUrl: '/login' })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: 20,
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Conta Suspensa</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
        A tua conta foi suspensa. Não podes aceder à plataforma.
      </p>
      <p style={{ color: 'var(--text3)', fontSize: 14 }}>
        A redirecionar para o login...
      </p>
    </div>
  )
}