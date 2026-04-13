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
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  const onVerifyRef = useRef(onVerify)
  const onErrorRef = useRef(onError)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onVerifyRef.current = onVerify
    onErrorRef.current = onError
    onExpireRef.current = onExpire
  }, [onVerify, onError, onExpire])

  useEffect(() => {
    let mounted = true

    loadTurnstileScript().then(() => {
      if (mounted) {
        setIsReady(true)
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!isReady || !containerRef.current || !window.turnstile) return
    if (!containerRef.current.isConnected) return

    const container = containerRef.current
    const widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      callback: (token) => onVerifyRef.current(token),
      'error-callback': () => onErrorRef.current?.(),
      'expired-callback': () => onExpireRef.current?.(),
      theme,
      size,
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
  }, [isReady, siteKey, theme, size])

  return (
    <div className={`login-turnstile${className ? ` ${className}` : ''}`} style={{ margin: '0.5rem 0 0.75rem' }}>
      <div ref={containerRef} />
    </div>
  )
}
