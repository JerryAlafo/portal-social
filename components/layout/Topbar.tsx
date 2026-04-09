'use client'

import { useState } from 'react'
import { Search, Bell, Sun, Moon, X, Menu } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useSidebar } from '@/lib/sidebar-context'
import styles from './Topbar.module.css'

const notifications = [
  { id: 1, initials: 'RK', color: '#1a1030', textColor: '#e879f9', text: 'RyuKen gostou da tua publicacao sobre One Piece', time: 'Agora mesmo', unread: true },
  { id: 2, initials: 'AK', color: '#0a2015', textColor: '#5cfcb4', text: 'AkiraFan comentou: "Concordo totalmente!"', time: '2 min', unread: true },
  { id: 3, initials: 'YS', color: '#1a1000', textColor: '#fcb45c', text: 'YukiSenpai passou a seguir-te', time: '15 min', unread: true },
  { id: 4, initials: 'NZ', color: '#0a0a2a', textColor: '#7c5cfc', text: 'NaruZuki partilhou a tua publicacao', time: '1h', unread: false },
  { id: 5, initials: 'SH', color: '#1a0010', textColor: '#fc5c7d', text: 'SakuraHime gostou da tua foto de perfil', time: '3h', unread: false },
]

interface TopbarProps {
  title: string
}

export default function Topbar({ title }: TopbarProps) {
  const { theme, toggleTheme } = useTheme()
  const { toggle: toggleSidebar } = useSidebar()
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

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

        <button className={styles.iconBtn} onClick={() => setNotifOpen(true)} aria-label="Notificacoes">
          <Bell size={16} />
          <span className={styles.notifDot} />
        </button>

        <button className={styles.themeBtn} onClick={toggleTheme} aria-label="Alternar tema">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span className={styles.themeBtnLabel}>
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </span>
        </button>
      </header>

      {/* Overlay */}
      {notifOpen && (
        <div className={styles.overlay} onClick={() => setNotifOpen(false)} />
      )}

      {/* Notification panel */}
      <div className={`${styles.notifPanel} ${notifOpen ? styles.notifOpen : ''}`}>
        <div className={styles.notifHeader}>
          <span className={styles.notifTitle}>Notificacoes</span>
          <button className={styles.closeBtn} onClick={() => setNotifOpen(false)}>
            <X size={14} />
          </button>
        </div>
        <div className={styles.notifList}>
          {notifications.map(n => (
            <div key={n.id} className={`${styles.notifItem} ${n.unread ? styles.unread : ''}`}>
              <div
                className={styles.notifAvatar}
                style={{ background: n.color, color: n.textColor }}
              >
                {n.initials}
              </div>
              <div className={styles.notifContent}>
                <p className={styles.notifText}>{n.text}</p>
                <span className={styles.notifTime}>{n.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
