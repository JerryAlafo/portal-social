'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, Sun, Moon, X, Menu } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/lib/theme-context'
import { useSidebar } from '@/lib/sidebar-context'
import { getNotifications, markAllAsRead } from '@/services/notifications'
import { useGuestMode } from './GuestModeProvider'
import type { Notification } from '@/types'
import styles from './Topbar.module.css'

interface TopbarProps {
  title: string
}

export default function Topbar({ title }: TopbarProps) {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { toggle: toggleSidebar } = useSidebar()
  const { data: session } = useSession()
  const { isGuest, requestLogin } = useGuestMode()
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [hasUnread, setHasUnread] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/pesquisar?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)

    if (!session?.user || isGuest) return () => clearInterval(timer)

    getNotifications()
      .then(res => {
        if (res.data) {
          setNotifications(res.data)
          setHasUnread(res.data.some(n => !n.is_read))
        }
      })
      .catch(() => {}) // fail silently — user still sees UI
    return () => clearInterval(timer)
  }, [isGuest, session?.user])

  const openNotifs = () => {
    if (isGuest) {
      requestLogin({
        title: 'Notificacoes protegidas',
        message: 'Entra na tua conta para veres notificacoes e atividade pessoal.',
        returnTo: '/feed',
      })
      return
    }

    setNotifOpen(true)
    if (hasUnread) {
      markAllAsRead().then(() => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setHasUnread(false)
      }).catch(() => {})
    }
  }

  const typeLabel = (type: Notification['type'], actorName: string) => {
    switch (type) {
      case 'like':    return `${actorName} gostou da tua publicação`
      case 'comment': return `${actorName} comentou a tua publicação`
      case 'follow':  return `${actorName} passou a seguir-te`
      case 'share':   return `${actorName} partilhou a tua publicação`
      case 'mention': return `${actorName} enviou uma atualização para ti`
    }
  }

  const notificationHref = (notification: Notification) => {
    if (notification.type === 'follow' && notification.actor) {
      return `/perfil/${notification.actor.username}`
    }
    if (notification.post_id) {
      return `/post/${notification.post_id}`
    }
    return '/mensagens'
  }

  const timeAgo = (dateStr: string) => {
    const diff = now - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'Agora mesmo'
    if (mins < 60) return `${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <>
      <header className={styles.topbar}>
        <button className={styles.burgerBtn} onClick={toggleSidebar} aria-label="Abrir menu">
          <Menu size={20} />
        </button>

        <h1 className={styles.title}>{title}</h1>

        <div className={`${styles.searchBar} ${searchOpen ? styles.searchOpen : ''}`}>
          <Search size={14} color="var(--text3)" />
          <form onSubmit={handleSearch} style={{ display: 'contents' }}>
            <input 
              type="text" 
              placeholder="Pesquisar no PORTAL..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus={searchOpen}
            />
          </form>
        </div>

        <button
          className={`${styles.iconBtn} ${styles.searchToggle}`}
          onClick={() => setSearchOpen(p => !p)}
          aria-label="Pesquisar"
        >
          <Search size={16} />
        </button>

        <button className={styles.iconBtn} onClick={openNotifs} aria-label="Notificações">
          <Bell size={16} />
          {hasUnread && <span className={styles.notifDot} />}
        </button>

        <button className={styles.themeBtn} onClick={toggleTheme} aria-label="Alternar tema">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span className={styles.themeBtnLabel}>
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </span>
        </button>
      </header>

      {notifOpen && <div className={styles.overlay} onClick={() => setNotifOpen(false)} />}

      <div className={`${styles.notifPanel} ${notifOpen ? styles.notifOpen : ''}`}>
        <div className={styles.notifHeader}>
          <span className={styles.notifTitle}>Notificações</span>
          <button className={styles.closeBtn} onClick={() => setNotifOpen(false)}>
            <X size={14} />
          </button>
        </div>
        <div className={styles.notifList}>
          {notifications.length === 0 && (
            <p className={styles.notifEmpty}>Sem notificações por enquanto.</p>
          )}
          {notifications.map(n => (
            <div key={n.id} className={`${styles.notifItem} ${!n.is_read ? styles.unread : ''}`}>
              <Link
                 href={notificationHref(n)}
                 className={styles.notifAvatar}
                 style={{ background: 'var(--bg4)', color: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
               >
                 {n.actor?.avatar_initials || '??'}
               </Link>
              <div className={styles.notifContent}>
                  <p className={styles.notifText}>
                   <Link href={notificationHref(n)} style={{ textDecoration: 'none', color: 'inherit', fontWeight: n.is_read ? 400 : 600 }}>
                     {typeLabel(n.type, n.actor?.display_name ?? 'Utilizador')}
                   </Link>
                 </p>
                <span className={styles.notifTime}>{timeAgo(n.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
