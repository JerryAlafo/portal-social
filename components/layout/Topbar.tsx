'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Bell, Sun, Moon, X, Menu } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useSidebar } from '@/lib/sidebar-context'
import { getNotifications, markAllAsRead } from '@/services/notifications'
import type { Notification } from '@/types'
import styles from './Topbar.module.css'

interface TopbarProps {
  title: string
}

export default function Topbar({ title }: TopbarProps) {
  const { theme, toggleTheme } = useTheme()
  const { toggle: toggleSidebar } = useSidebar()
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [hasUnread, setHasUnread] = useState(false)
  // eslint-disable-next-line react-hooks/purity
  const nowRef = useRef(Date.now())

  useEffect(() => {
    getNotifications()
      .then(res => {
        if (res.data) {
          setNotifications(res.data)
          setHasUnread(res.data.some(n => !n.is_read))
        }
      })
      .catch(() => {}) // fail silently — user still sees UI
  }, [])

  const openNotifs = () => {
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
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = nowRef.current - new Date(dateStr).getTime()
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
          <input type="text" placeholder="Pesquisar no PORTAL..." />
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
              <div
                className={styles.notifAvatar}
                style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}
              >
                {n.actor.avatar_initials}
              </div>
              <div className={styles.notifContent}>
                <p className={styles.notifText}>{typeLabel(n.type, n.actor.display_name)}</p>
                <span className={styles.notifTime}>{timeAgo(n.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
