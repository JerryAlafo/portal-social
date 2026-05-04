'use client'

import type { MouseEvent } from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home, Search, Heart, MessageCircle, TrendingUp,
  BookOpen, Calendar, Layers, Image as ImageIcon, User, Settings,
  LogOut, Star, ShieldAlert, X, Sparkles, LogIn
} from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'
import { useSession } from 'next-auth/react'
import { logout } from '@/services/auth'
import { isGuestBlockedPath } from '@/lib/guest-mode'
import { useGuestMode } from './GuestModeProvider'
import styles from './Sidebar.module.css'

const navMain = [
  { href: '/feed',      icon: Home,          label: 'Feed' },
  { href: '/pesquisar', icon: Search,        label: 'Pesquisar' },
  { href: '/seguindo',  icon: Heart,         label: 'Seguindo' },
  { href: '/mensagens', icon: MessageCircle, label: 'Mensagens' },
  { href: '/explorar',  icon: TrendingUp,    label: 'Explorar' },
]

const navEspecial = [
  { href: '/noticias', icon: BookOpen, label: 'Noticias' },
  { href: '/eventos',  icon: Calendar, label: 'Eventos' },
  { href: '/fanfics',  icon: Layers,   label: 'Fanfics' },
  { href: '/galeria', icon: ImageIcon, label: 'Galeria' },
  { href: '/ia-portal', icon: Sparkles, label: 'IA Portal' },
]

const navConta = [
  { href: '/perfil',        icon: User,        label: 'Meu Perfil' },
  { href: '/admin',         icon: ShieldAlert, label: 'Administracao', adminOnly: true },
  { href: '/configuracoes', icon: Settings,    label: 'Configuracoes' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()
  const { data: session } = useSession()
  const { isGuest, requestLogin } = useGuestMode()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/counts')
        const data = await res.json()
        if (data.data) {
          setUnreadMessages(data.data.unreadMessages)
          setUnreadNotifications(data.data.unreadNotifications)
        }
      } catch (err) {
        console.error('Erro ao buscar contagens:', err)
      }
    }
    if (session) {
      fetchCounts()
      const interval = setInterval(fetchCounts, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const user = session?.user
  const displayName = user?.name ?? 'Utilizador'
  const initials = user?.avatar_initials || displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const username = user?.username ? `@${user.username}` : ''
  const role = user?.role ?? 'member'
  const isAdmin = role === 'superuser' || role === 'mod'

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isGuest && isGuestBlockedPath(href)) {
      event.preventDefault()
      close()
      requestLogin({ returnTo: href })
      return
    }

    close()
  }

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.logo}>
        <Link href="/feed" className={styles.logoMark} onClick={close}>
          <NextImage src="/favicon.png" alt="PORTAL" width={26} height={26} />
          PORTAL
          <span className={styles.logoBeta}>Beta</span>
        </Link>
        <button className={styles.closeBtn} onClick={close} aria-label="Fechar menu">
          <X size={18} />
        </button>
      </div>

      <nav className={styles.nav}>
        <p className={styles.navLabel}>Principal</p>
        {navMain.map(({ href, icon: Icon, label }) => {
          const showBadge = href === '/mensagens' && unreadMessages > 0
          const badge = showBadge ? String(unreadMessages) : null

          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${pathname === href ? styles.active : ''}`}
              onClick={(event) => handleNavClick(event, href)}
            >
              <Icon size={18} />
              {label}
              {badge && (
                <span className={`${styles.badge} ${styles.badgeRed}`}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}

        <p className={styles.navLabel}>Area Especial</p>
        {navEspecial.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${pathname === href ? styles.active : ''}`}
            onClick={(event) => handleNavClick(event, href)}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}

        <p className={styles.navLabel}>Conta</p>
        {navConta.map(({ href, icon: Icon, label, adminOnly }) => {
          if (adminOnly && !isAdmin) return null
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${pathname.startsWith(href) ? styles.active : ''}`}
              onClick={(event) => handleNavClick(event, href)}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
        {isGuest ? (
          <button
            className={`${styles.navItem} ${styles.navLogin}`}
            onClick={() => { close(); requestLogin({ returnTo: pathname }) }}
          >
            <LogIn size={18} />
            Entrar ou criar conta
          </button>
        ) : (
          <button
            className={`${styles.navItem} ${styles.navDanger}`}
            onClick={() => { close(); logout() }}
          >
            <LogOut size={18} />
            Sair
          </button>
        )}
      </nav>

      <div className={styles.footer}>
        <Link href="/perfil" className={styles.userCard} onClick={(event) => handleNavClick(event, '/perfil')}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userRole}>{username}{role === 'superuser' ? ' · Super User' : role === 'mod' ? ' · Mod' : ''}</span>
          </div>
          {role === 'superuser' && <Star size={14} color="var(--text3)" />}
        </Link>
      </div>
    </aside>
  )
}
