'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw, Newspaper } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

const CATS = ['Tudo', 'Anime', 'Manga', 'Industria', 'Eventos', 'PORTAL']

interface NewsItem {
  id: string
  title: string
  summary: string
  category: string
  source: string
  reads_count?: number
  pinned?: boolean
  published_at: string
  author?: {
    username: string
    role?: string
  }
}

export default function NoticiasPage() {
  const [activeCat, setActiveCat] = useState('Tudo')
  const [news, setNews] = useState<NewsItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateNews = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/news/generate', { method: 'POST' })
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
        return
      }
      
      if (data.data?.generatedItems) {
        setNews(data.data.generatedItems)
      }
    } catch (err) {
      console.error('Erro ao gerar noticias:', err)
      setError('Erro ao gerar notícias. Tenta novamente.')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    generateNews()
  }, [])

  const filtered = activeCat === 'Tudo' ? news : news.filter(n => 
    n.category?.toLowerCase() === activeCat.toLowerCase()
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  return (
    <div className={styles.page}>
      <Topbar title="Noticias" />
      <div className={styles.body}>
        <div className={styles.mainCol}>
          <div className={styles.cats}>
            {CATS.map(c => (
              <button key={c} className={`${styles.catBtn} ${activeCat === c ? styles.catActive : ''}`} onClick={() => setActiveCat(c)}>{c}</button>
            ))}
            <button 
              className={`${styles.catBtn} ${generating ? styles.catActive : ''}`} 
              onClick={generateNews}
              disabled={generating}
            >
              <RefreshCw size={14} className={generating ? styles.spinning : ''} />
              {generating ? 'Gerando...' : 'Atualizar'}
            </button>
          </div>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {news.length === 0 && !generating && !error && (
            <div className={styles.empty}>
              <Newspaper size={48} opacity={0.3} />
              <p>Carrega em <strong>Atualizar</strong> para gerar as últimas notícias de anime e manga.</p>
            </div>
          )}

          {filtered.map(n => (
            <NewsCard key={n.id} item={n} formatDate={formatDate} fmt={fmt} />
          ))}
        </div>

        {news.length > 0 && (
          <aside className={styles.rightPanel}>
            <p className={styles.panelTitle}>Top notícias</p>
            {[...news].slice(0, 5).map((n, i) => (
              <div key={n.id} className={styles.topItem}>
                <span className={styles.topRank}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className={styles.topTitle}>{n.title}</div>
                  <div className={styles.topMeta}>{formatDate(n.published_at)}</div>
                </div>
              </div>
            ))}
          </aside>
        )}
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

  const handleReadMore = () => {
    const searchQuery = encodeURIComponent(item.title)
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank')
  }

  return (
    <article className={styles.newsCard}>
      <div className={styles.newsMeta}>
        <span className={styles.newsCat} style={{ color: catColors[item.category] || 'var(--text2)' }}>{item.category}</span>
        <span className={styles.newsTime}>{formatDate(item.published_at)}</span>
      </div>
      <h2 className={styles.newsTitle}>{item.title}</h2>
      <p className={styles.newsSummary}>{item.summary}</p>
      <div className={styles.newsFooter}>
        <div className={styles.newsAuthor}>
          Fonte: <strong>{item.source || 'PORTAL'}</strong>
          <span className={styles.badgeAI}>Gerado por IA</span>
        </div>
        <button className={styles.readMore} onClick={handleReadMore}>
          Ler mais <ExternalLink size={12} />
        </button>
      </div>
    </article>
  )
}
