'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Eye, LogIn } from 'lucide-react'
import {
  clearGuestMode,
  enableGuestMode,
  GUEST_MODE_CHANGED_EVENT,
  isGuestBlockedPath,
  isGuestModeActive,
  isGuestPublicPath,
  LOGIN_REQUIRED_EVENT,
  type LoginRequiredDetail,
} from '@/lib/guest-mode'
import styles from './GuestModeProvider.module.css'

interface GuestModeContextValue {
  isGuest: boolean
  requestLogin: (detail?: LoginRequiredDetail) => void
}

const GuestModeContext = createContext<GuestModeContextValue>({
  isGuest: false,
  requestLogin: () => {},
})

function currentReturnTo(pathname: string) {
  if (typeof window === 'undefined') return pathname
  return `${pathname}${window.location.search}${window.location.hash}`
}

function subscribeGuestMode(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  window.addEventListener(GUEST_MODE_CHANGED_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(GUEST_MODE_CHANGED_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function useGuestMode() {
  return useContext(GuestModeContext)
}

export default function GuestModeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { status } = useSession()
  const [modal, setModal] = useState<LoginRequiredDetail | null>(null)
  const guestModeActive = useSyncExternalStore(
    subscribeGuestMode,
    isGuestModeActive,
    () => false
  )
  const isGuest = status !== 'authenticated' && guestModeActive
  const shouldPromptGuestMode =
    status === 'unauthenticated' &&
    !guestModeActive &&
    isGuestPublicPath(pathname)
  const guestPromptTitle = pathname.startsWith('/post/')
    ? 'Ver publicacao como convidado?'
    : 'Continuar como convidado?'
  const guestPromptMessage = pathname.startsWith('/post/')
    ? 'Podes ver esta publicacao normalmente em modo convidado. Para gostar, comentar ou seguir alguem, vamos pedir login.'
    : 'Podes explorar esta area em modo convidado. Acoes como gostar, comentar e seguir continuam a pedir login.'

  useEffect(() => {
    if (status === 'authenticated' && guestModeActive) {
      clearGuestMode()
    }
  }, [guestModeActive, status])

  const requestLogin = useCallback((detail: LoginRequiredDetail = {}) => {
    setModal({
      title: detail.title || 'Login obrigatorio',
      message:
        detail.message ||
        'Para fazer esta acao, entra na tua conta ou cria uma conta no PORTAL.',
      returnTo: detail.returnTo || currentReturnTo(pathname),
    })
  }, [pathname])

  useEffect(() => {
    const handleLoginRequired = (event: Event) => {
      requestLogin((event as CustomEvent<LoginRequiredDetail>).detail || {})
    }

    window.addEventListener(LOGIN_REQUIRED_EVENT, handleLoginRequired)
    return () => window.removeEventListener(LOGIN_REQUIRED_EVENT, handleLoginRequired)
  }, [requestLogin])

  useEffect(() => {
    if (!isGuest) return

    const params = new URLSearchParams(window.location.search)
    if (params.get('loginRequired') === '1') {
      window.setTimeout(() => {
        requestLogin({
          returnTo: params.get('next') || undefined,
        })
      }, 0)
    }
  }, [isGuest, pathname, requestLogin])

  useEffect(() => {
    if (!isGuest || !isGuestBlockedPath(pathname)) return

    const next = encodeURIComponent(currentReturnTo(pathname))
    router.replace(`/feed?loginRequired=1&next=${next}`)
  }, [isGuest, pathname, router])

  const goToLogin = useCallback((returnTo?: string) => {
    clearGuestMode()
    setModal(null)
    const callbackUrl = encodeURIComponent(returnTo || currentReturnTo(pathname))
    router.push(`/login?callbackUrl=${callbackUrl}`)
  }, [pathname, router])

  const continueAsGuest = useCallback(() => {
    setModal(null)
    enableGuestMode()
  }, [])

  const value = useMemo(() => ({
    isGuest,
    requestLogin,
  }), [isGuest, requestLogin])

  return (
    <GuestModeContext.Provider value={value}>
      {children}

      {isGuest && (
        <div className={styles.guestBadge} role="status" aria-label="Modo convidado ativo">
          <div className={styles.guestIcon}>
            <Eye size={18} />
          </div>
          <div className={styles.guestText}>
            <span className={styles.guestTitle}>Modo convidado</span>
            <span className={styles.guestDescription}>Algumas acoes precisam de login.</span>
          </div>
          <button className={styles.guestAction} type="button" onClick={() => goToLogin()}>
            <LogIn size={14} />
            Entrar
          </button>
        </div>
      )}

      {modal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="guest-login-title">
            <div className={styles.modalIcon}>
              <LogIn size={24} />
            </div>
            <h2 id="guest-login-title" className={styles.modalTitle}>{modal.title}</h2>
            <p className={styles.modalText}>{modal.message}</p>
            <button className={styles.modalButton} type="button" onClick={() => goToLogin(modal.returnTo)}>
              OK, entrar ou criar conta
            </button>
          </div>
        </div>
      )}

      {!modal && shouldPromptGuestMode && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="guest-view-title">
            <div className={styles.modalIcon}>
              <Eye size={24} />
            </div>
            <h2 id="guest-view-title" className={styles.modalTitle}>{guestPromptTitle}</h2>
            <p className={styles.modalText}>{guestPromptMessage}</p>
            <button className={styles.modalButton} type="button" onClick={continueAsGuest}>
              Ver como convidado
            </button>
          </div>
        </div>
      )}
    </GuestModeContext.Provider>
  )
}
