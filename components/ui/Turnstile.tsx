'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
}

interface TurnstileProps {
  siteKey: string
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
  className?: string
}

let scriptLoadPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise

  if (window.turnstile) {
    scriptLoadPromise = Promise.resolve()
    return scriptLoadPromise
  }

  scriptLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      const checkTurnstile = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkTurnstile)
          resolve()
        }
      }, 50)
    }
    
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

export default function Turnstile({ siteKey, onVerify, onError, onExpire, theme = 'auto', size = 'normal', className }: TurnstileProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)
  const normalizedSiteKey = siteKey.trim()
  const BASE_WIDTH = 300
  const BASE_HEIGHT = 65
  const MOBILE_BREAKPOINT = 768
  const DESKTOP_MAX_SCALE_X = 1.45
  const DESKTOP_MAX_SCALE_Y = 1.15

  const onVerifyRef = useRef(onVerify)
  const onErrorRef = useRef(onError)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onVerifyRef.current = onVerify
    onErrorRef.current = onError
    onExpireRef.current = onExpire
  }, [onVerify, onError, onExpire])

  useEffect(() => {
    if (!normalizedSiteKey) return

    let mounted = true

    loadTurnstileScript().then(() => {
      if (mounted) {
        setIsReady(true)
      }
    })

    return () => {
      mounted = false
    }
  }, [normalizedSiteKey])

  useEffect(() => {
    if (!normalizedSiteKey || !isReady || !containerRef.current || !window.turnstile) return
    if (!containerRef.current.isConnected) return

    const container = containerRef.current
    const widgetId = window.turnstile.render(container, {
      sitekey: normalizedSiteKey,
      callback: (token) => onVerifyRef.current(token),
      'error-callback': () => onErrorRef.current?.(),
      'expired-callback': () => onExpireRef.current?.(),
      theme,
      size: 'normal',
    })

    widgetIdRef.current = widgetId

    return () => {
      const currentWidgetId = widgetIdRef.current
      if (currentWidgetId && window.turnstile && document.contains(container)) {
        try {
          window.turnstile.remove(currentWidgetId)
        } catch {
        }
      }
      widgetIdRef.current = null
    }
  }, [isReady, normalizedSiteKey, theme, size])

  useEffect(() => {
    const recalculateScale = () => {
      const host = hostRef.current
      if (!host) return

      const availableWidth = host.clientWidth
      if (!availableWidth) return

      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT
      const calculatedScaleX = Math.max(
        0.6,
        Math.min(availableWidth / BASE_WIDTH, isMobile ? 1 : DESKTOP_MAX_SCALE_X)
      )
      const calculatedScaleY = isMobile
        ? calculatedScaleX
        : Math.min(calculatedScaleX, DESKTOP_MAX_SCALE_Y)

      setScaleX(calculatedScaleX)
      setScaleY(calculatedScaleY)
    }

    recalculateScale()
    window.addEventListener('resize', recalculateScale)

    return () => {
      window.removeEventListener('resize', recalculateScale)
    }
  }, [])

  useEffect(() => {
    if (!normalizedSiteKey) {
      onErrorRef.current?.()
    }
  }, [normalizedSiteKey])

  return (
    <div className={`login-turnstile${className ? ` ${className}` : ''}`} style={{ margin: '0.5rem 0 0.75rem' }}>
      {normalizedSiteKey ? (
        <div
          ref={hostRef}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            minHeight: `${Math.ceil(BASE_HEIGHT * scaleY)}px`,
          }}
        >
          <div
            ref={containerRef}
            style={{
              width: `${BASE_WIDTH}px`,
              transform: `scale(${scaleX}, ${scaleY})`,
              transformOrigin: 'top center',
            }}
          />
        </div>
      ) : (
        <p className="login-error">Turnstile não configurado. Define NEXT_PUBLIC_TURNSTILE_SITE_KEY.</p>
      )}
    </div>
  )
}
