'use client'

import { useState } from 'react'
import { Image, Film, FileText, Send } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import PostCard from '@/components/posts/PostCard'
import { mockPosts, mockTrending, mockSuggestions, mockEvents } from '@/lib/mock-data'
import styles from './page.module.css'

const CATEGORIES = ['Tudo', 'Shonen', 'Shojo', 'Isekai', 'Seinen', 'Cosplay', 'Manga', 'Figura', 'AMV']
const TABS = ['Geral', 'A seguir', 'Noticias', 'Anuncios']

export default function FeedPage() {
  const [activeCategory, setActiveCategory] = useState('Tudo')
  const [activeTab, setActiveTab] = useState('Geral')
  const [posts, setPosts] = useState(mockPosts)
  const [followed, setFollowed] = useState<Set<string>>(new Set())

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const handleFollow = (name: string) => {
    setFollowed(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div className={styles.page}>
      <Topbar title="Feed" />

      <div className={styles.body}>
        {/* FEED COLUMN */}
        <div className={styles.feedCol}>

          {/* Compose box */}
          <div className={styles.compose}>
            <div className={styles.composeTop}>
              <div className={styles.composeAvatar}>JA</div>
              <div className={styles.composeInput}>O que esta a pensar, Jerry?</div>
            </div>
            <div className={styles.composeActions}>
              <button className={styles.composeBtn}><Image size={15} />Imagem</button>
              <button className={styles.composeBtn}><Film size={15} />Video</button>
              <button className={styles.composeBtn}><FileText size={15} />Artigo</button>
              <button className={styles.submitBtn}><Send size={14} />Publicar</button>
            </div>
          </div>

          {/* Categories */}
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

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t}
                className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className={styles.posts}>
            {posts.map((post, i) => (
              <div
                key={post.id}
                className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 4)}`}
              >
                <PostCard post={post} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <aside className={styles.rightPanel}>

          <div className={styles.panelSection}>
            <p className={styles.panelTitle}>Em destaque</p>
            {mockTrending.map(t => (
              <div key={t.rank} className={styles.trendingItem}>
                <span className={styles.trendingRank}>{t.rank}</span>
                <div>
                  <div className={styles.trendingTag}>#{t.tag}</div>
                  <div className={styles.trendingCount}>{t.count}</div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.panelSection}>
            <p className={styles.panelTitle}>Sugestoes</p>
            {mockSuggestions.map(u => (
              <div key={u.name} className={styles.suggUser}>
                <div
                  className={styles.suggAvatar}
                  style={{ background: u.bg, color: u.color }}
                >
                  {u.initials}
                </div>
                <div className={styles.suggInfo}>
                  <div className={styles.suggName}>{u.name}</div>
                  <div className={styles.suggHandle}>{u.handle} · {u.followers}</div>
                </div>
                <button
                  className={`${styles.followBtn} ${followed.has(u.name) ? styles.followingBtn : ''}`}
                  onClick={() => handleFollow(u.name)}
                >
                  {followed.has(u.name) ? 'A seguir' : 'Seguir'}
                </button>
              </div>
            ))}
          </div>

          <div className={styles.panelSection}>
            <p className={styles.panelTitle}>Proximos eventos</p>
            {mockEvents.map(ev => (
              <div key={ev.title} className={styles.eventCard}>
                <div className={styles.eventDate} style={{ color: ev.dateColor }}>{ev.date}</div>
                <div className={styles.eventTitle}>{ev.title}</div>
                <div className={styles.eventCount}>{ev.interested}</div>
              </div>
            ))}
          </div>

          <p className={styles.panelFooter}>
            Termos · Privacidade · Sobre · Ajuda<br />
            <span>PORTAL Beta © 2026 · Tablu Tech</span>
          </p>
        </aside>
      </div>
    </div>
  )
}
