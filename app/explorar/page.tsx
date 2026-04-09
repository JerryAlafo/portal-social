'use client'

import { useState } from 'react'
import { TrendingUp, Flame, Clock, Star } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import PostCard from '@/components/posts/PostCard'
import { mockPosts } from '@/lib/mock-data'
import styles from './page.module.css'

const FILTERS = [
  { id: 'trending', label: 'Em Alta', icon: TrendingUp },
  { id: 'hot', label: 'Popular', icon: Flame },
  { id: 'recent', label: 'Recente', icon: Clock },
  { id: 'top', label: 'Top', icon: Star },
]

const CATEGORIES = ['Tudo', 'Shonen', 'Shojo', 'Isekai', 'Seinen', 'Cosplay', 'Manga', 'Figura', 'AMV', 'Fanfic', 'Arte']

const FEATURED = [
  { title: 'Frieren: Beyond Journey\'s End', sub: 'Anime do Ano 2024', count: '3.8k discussoes', bg: 'linear-gradient(135deg, #0d1a40, #1a0840)', accent: 'var(--accent2)' },
  { title: 'Lisboa Anime Fest 2026', sub: 'Evento · 20 Abr', count: '342 interessados', bg: 'linear-gradient(135deg, #1a0010, #2a0020)', accent: 'var(--pink)' },
  { title: 'Demon Slayer: Infinity Castle', sub: 'Temporada em curso', count: '4.2k discussoes', bg: 'linear-gradient(135deg, #0a1a00, #1a0800)', accent: 'var(--amber)' },
]

export default function ExplorarPage() {
  const [activeFilter, setActiveFilter] = useState('trending')
  const [activeCategory, setActiveCategory] = useState('Tudo')
  const [followed, setFollowed] = useState<Set<string>>(new Set())

  return (
    <div className={styles.page}>
      <Topbar title="Explorar" />
      <div className={styles.body}>
        <div className={styles.mainCol}>

          {/* Featured cards */}
          <div className={styles.featured}>
            {FEATURED.map(f => (
              <div key={f.title} className={styles.featuredCard} style={{ background: f.bg }}>
                <div className={styles.featuredSub} style={{ color: f.accent }}>{f.sub}</div>
                <div className={styles.featuredTitle}>{f.title}</div>
                <div className={styles.featuredCount}>{f.count}</div>
              </div>
            ))}
          </div>

          {/* Filter + category */}
          <div className={styles.filters}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                className={`${styles.filterBtn} ${activeFilter === f.id ? styles.filterActive : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                <f.icon size={14} />
                {f.label}
              </button>
            ))}
          </div>

          <div className={styles.chips}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`${styles.chip} ${activeCategory === c ? styles.chipActive : ''}`}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className={styles.posts}>
            {[...mockPosts].reverse().map(p => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </div>

        {/* Right */}
        <aside className={styles.rightPanel}>
          <p className={styles.panelTitle}>Membros em destaque</p>
          {[
            { name: 'PortalAdmin', handle: '@portal_admin', role: 'Super User', initials: 'PO', bg: '#1a0030', color: '#e879f9', followers: '24.8k' },
            { name: 'YukiSenpai', handle: '@yukisenpai', role: 'Moderador', initials: 'YS', bg: '#1a1000', color: '#fcb45c', followers: '2.1k' },
            { name: 'SakuraHime', handle: '@sakurahime', role: 'Membro', initials: 'SH', bg: '#1a0010', color: '#fc5c7d', followers: '3.4k' },
          ].map(u => (
            <div key={u.name} className={styles.featuredUser}>
              <div className={styles.featuredUserAvatar} style={{ background: u.bg, color: u.color }}>{u.initials}</div>
              <div className={styles.featuredUserInfo}>
                <span className={styles.featuredUserName}>{u.name}</span>
                <span className={styles.featuredUserMeta}>{u.handle} · {u.followers}</span>
              </div>
              <button
                className={`${styles.followBtn} ${followed.has(u.name) ? styles.followingBtn : ''}`}
                onClick={() => setFollowed(prev => { const n = new Set(prev); n.has(u.name) ? n.delete(u.name) : n.add(u.name); return n })}
              >
                {followed.has(u.name) ? 'A seguir' : 'Seguir'}
              </button>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
