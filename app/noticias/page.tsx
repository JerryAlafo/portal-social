'use client'

import { useState, useEffect } from 'react'
import { Pin, ExternalLink, Clock } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

const CATS = ['Tudo', 'Anime', 'Manga', 'Industria', 'Eventos', 'PORTAL']

interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  category: string
  author_id: string
  image_url: string
  reads_count: number
  pinned: boolean
  published_at: string
  author?: {
    username: string
    role?: string
  }
}

export default function NoticiasPage() {
  const [activeCat, setActiveCat] = useState('Tudo')
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news')
        const data = await res.json()
        if (data.data) setNews(data.data)
      } catch (err) {
        console.error('Erro ao carregar noticias:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  const filtered = activeCat === 'Tudo' ? news : news.filter(n => n.category === activeCat)
  const pinned = filtered.filter(n => n.pinned)
  const rest = filtered.filter(n => !n.pinned)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 3600) return `Há ${Math.floor(diff / 60)} minutos`
    if (diff < 86400) return `Há ${Math.floor(diff / 3600)} horas`
    if (diff < 604800) return `Há ${Math.floor(diff / 86400)} dias`
    return date.toLocaleDateString('pt-PT')
  }

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  if (loading) {
    return (
      <div className={styles.page}>
        <Topbar title="Noticias" />
        <div className={styles.body}>
          <div className={styles.mainCol}>
            <div className={styles.loading}>A carregar noticias...</div>
          </div>
        </div>
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className={styles.page}>
        <Topbar title="Noticias" />
        <div className={styles.body}>
          <div className={styles.mainCol}>
            <div className={styles.empty}>Ainda nao ha noticias publicadas.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Topbar title="Noticias" />
      <div className={styles.body}>
        <div className={styles.mainCol}>
          <div className={styles.cats}>
            {CATS.map(c => (
              <button key={c} className={`${styles.catBtn} ${activeCat === c ? styles.catActive : ''}`} onClick={() => setActiveCat(c)}>{c}</button>
            ))}
          </div>

          {pinned.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}><Pin size={13} /> Fixadas</div>
              {pinned.map(n => <NewsCard key={n.id} item={n} formatDate={formatDate} fmt={fmt} />)}
            </div>
          )}

          <div className={styles.section}>
            {pinned.length > 0 && <div className={styles.sectionLabel}><Clock size={13} /> Recentes</div>}
            {rest.map(n => <NewsCard key={n.id} item={n} formatDate={formatDate} fmt={fmt} />)}
          </div>
        </div>

        <aside className={styles.rightPanel}>
          <p className={styles.panelTitle}>Mais lidas</p>
          {[...news].sort((a, b) => b.reads_count - a.reads_count).slice(0, 5).map((n, i) => (
            <div key={n.id} className={styles.topItem}>
              <span className={styles.topRank}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className={styles.topTitle}>{n.title}</div>
                <div className={styles.topMeta}>{fmt(n.reads_count)} leituras</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

function NewsCard({ item, formatDate, fmt }: { item: NewsItem; formatDate: (d: string) => string; fmt: (n: number) => string }) {
  const catColors: Record<string, string> = {
    'Anime': 'var(--accent2)',
    'Manga': 'var(--amber)',
    'Industria': 'var(--green)',
    'Eventos': 'var(--red)',
    'PORTAL': 'var(--pink)',
  }

  return (
    <article className={`${styles.newsCard} ${item.pinned ? styles.pinnedCard : ''}`}>
      {item.pinned && <div className={styles.pinnedTag}><Pin size={11} /> Fixada</div>}
      <div className={styles.newsMeta}>
        <span className={styles.newsCat} style={{ color: catColors[item.category] || 'var(--text2)' }}>{item.category}</span>
        <span className={styles.newsTime}>{formatDate(item.published_at)}</span>
        <span className={styles.newsReads}>{fmt(item.reads_count)} leituras</span>
      </div>
      <h2 className={styles.newsTitle}>{item.title}</h2>
      <p className={styles.newsSummary}>{item.summary}</p>
      <div className={styles.newsFooter}>
        <div className={styles.newsAuthor}>
          Por <strong>{item.author?.username || 'Portal'}</strong>
          {item.author?.role === 'superuser' && <span className={styles.badgeSU}>Super User</span>}
          {item.author?.role === 'mod' && <span className={styles.badgeMod}>Mod</span>}
        </div>
        <button className={styles.readMore}>Ler mais <ExternalLink size={12} /></button>
      </div>
    </article>
  )
}
