'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Home, Search, Heart, MessageCircle, TrendingUp,
  BookOpen, Calendar, Layers, Image, User, Settings,
  LogOut, Star, ShieldAlert, X
} from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'
import { logout } from '@/services/auth'
import styles from './Sidebar.module.css'

const navMain = [
  { href: '/feed',      icon: Home,          label: 'Feed' },
  { href: '/pesquisar', icon: Search,        label: 'Pesquisar' },
  { href: '/seguindo',  icon: Heart,         label: 'Seguindo',  badge: '3' },
  { href: '/mensagens', icon: MessageCircle, label: 'Mensagens', badge: '5', badgeRed: true },
  { href: '/explorar',  icon: TrendingUp,    label: 'Explorar' },
]

const navEspecial = [
  { href: '/noticias', icon: BookOpen, label: 'Noticias' },
  { href: '/eventos',  icon: Calendar, label: 'Eventos' },
  { href: '/fanfics',  icon: Layers,   label: 'Fanfics' },
  { href: '/galeria',  icon: Image,    label: 'Galeria' },
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

  const user = session?.user
  const displayName = user?.name ?? 'Utilizador'
  const initials = user?.avatar_initials || displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const username = user?.username ? `@${user.username}` : ''
  const role = user?.role ?? 'member'
  const isAdmin = role === 'superuser' || role === 'mod'

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.logo}>
        <Link href="/feed" className={styles.logoMark} onClick={close}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="#7c5cfc" opacity="0.15"/>
            <circle cx="16" cy="16" r="14" stroke="#7c5cfc" strokeWidth="1.5"/>
            <path d="M10 12L16 8L22 12V20L16 24L10 20V12Z" stroke="#9b7fff" strokeWidth="1.5" fill="rgba(124,92,252,0.2)"/>
            <circle cx="16" cy="16" r="3" fill="#9b7fff"/>
          </svg>
          PORTAL
          <span className={styles.logoBeta}>Beta</span>
        </Link>
        <button className={styles.closeBtn} onClick={close} aria-label="Fechar menu">
          <X size={18} />
        </button>
      </div>

      <nav className={styles.nav}>
        <p className={styles.navLabel}>Principal</p>
        {navMain.map(({ href, icon: Icon, label, badge, badgeRed }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${pathname === href ? styles.active : ''}`}
            onClick={close}
          >
            <Icon size={18} />
            {label}
            {badge && (
              <span className={`${styles.badge} ${badgeRed ? styles.badgeRed : ''}`}>
                {badge}
              </span>
            )}
          </Link>
        ))}

        <p className={styles.navLabel}>Area Especial</p>
        {navEspecial.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${pathname === href ? styles.active : ''}`}
            onClick={close}
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
              onClick={close}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
        <button
          className={`${styles.navItem} ${styles.navDanger}`}
          onClick={() => { close(); logout() }}
        >
          <LogOut size={18} />
          Sair
        </button>
      </nav>

      <div className={styles.footer}>
        <Link href="/perfil" className={styles.userCard} onClick={close}>
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
