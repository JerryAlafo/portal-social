export const GUEST_MODE_COOKIE = 'portal_guest'
export const LOGIN_REQUIRED_EVENT = 'portal:login-required'
export const GUEST_MODE_CHANGED_EVENT = 'portal:guest-mode-changed'

export interface LoginRequiredDetail {
  title?: string
  message?: string
  returnTo?: string
}

const GUEST_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const GUEST_BLOCKED_PREFIXES = [
  '/admin',
  '/configuracoes',
  '/ia-portal',
  '/mensagens',
  '/onboarding',
  '/seguindo',
]
const GUEST_BLOCKED_EXACT = ['/perfil']
const GUEST_PUBLIC_EXACT = [
  '/eventos',
  '/explorar',
  '/fanfics',
  '/feed',
  '/galeria',
  '/noticias',
  '/pesquisar',
]
const GUEST_PUBLIC_PREFIXES = [
  '/perfil/',
  '/post/',
]

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

export function isGuestBlockedPath(pathname: string) {
  const path = normalizePath(pathname)

  if (GUEST_BLOCKED_EXACT.includes(path)) return true

  return GUEST_BLOCKED_PREFIXES.some((prefix) => {
    return path === prefix || path.startsWith(`${prefix}/`)
  })
}

export function isGuestPublicPath(pathname: string) {
  const path = normalizePath(pathname)

  if (GUEST_PUBLIC_EXACT.includes(path)) return true

  return GUEST_PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))
}

export function enableGuestMode() {
  if (typeof document === 'undefined') return

  document.cookie = `${GUEST_MODE_COOKIE}=1; path=/; max-age=${GUEST_COOKIE_MAX_AGE}; SameSite=Lax`

  try {
    window.localStorage.setItem(GUEST_MODE_COOKIE, '1')
  } catch {
    // Ignore storage errors, the cookie is the source of truth for routing.
  }

  window.dispatchEvent(new Event(GUEST_MODE_CHANGED_EVENT))
}

export function clearGuestMode() {
  if (typeof document === 'undefined') return

  document.cookie = `${GUEST_MODE_COOKIE}=; path=/; max-age=0; SameSite=Lax`

  try {
    window.localStorage.removeItem(GUEST_MODE_COOKIE)
  } catch {
    // Ignore storage errors.
  }

  window.dispatchEvent(new Event(GUEST_MODE_CHANGED_EVENT))
}

export function isGuestModeActive() {
  if (typeof document === 'undefined') return false

  const hasCookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .some((item) => item === `${GUEST_MODE_COOKIE}=1`)

  if (hasCookie) return true

  try {
    return window.localStorage.getItem(GUEST_MODE_COOKIE) === '1'
  } catch {
    return false
  }
}

export function notifyLoginRequired(detail: LoginRequiredDetail = {}) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent<LoginRequiredDetail>(LOGIN_REQUIRED_EVENT, { detail })
  )
}
