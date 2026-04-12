'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Heart, Eye, Clock, Filter } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

const GENRES = ['Tudo', 'Isekai', 'Shonen', 'Shojo', 'Seinen', 'Romance', 'Aventura', 'Comedia']
const STATUS = ['Todos', 'Em curso', 'Completo', 'Pausado']

interface Fanfic {
  id: string
  title: string
  summary: string
  genre: string
  fandom: string
  status: string
  chapters: number
  words_count: number
  author_id: string
  likes_count: number
  reads_count: number
  created_at: string
  updated_at: string
  author?: {
    id: string
    username: string
    display_name: string
    avatar_initials: string
    avatar_url?: string
  }
}

const STATUS_COLORS: Record<string, string> = {
  'Em curso': 'var(--green)',
  'Completo': 'var(--accent2)',
  'Pausado': 'var(--amber)',
}

export default function FanficsPage() {
  const [activeGenre, setActiveGenre] = useState('Tudo')
  const [activeStatus, setActiveStatus] = useState('Todos')
  const [fanfics, setFanfics] = useState<Fanfic[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<'recent' | 'reads' | 'likes'>('recent')

  useEffect(() => {
    const fetchFanfics = async () => {
      try {
        const res = await fetch('/api/fanfics')
        const data = await res.json()
        if (data.data) setFanfics(data.data)
      } catch (err) {
        console.error('Erro ao carregar fanfics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFanfics()
  }, [])

  const filtered = fanfics
    .filter(f => activeGenre === 'Tudo' || f.genre?.toLowerCase().includes(activeGenre.toLowerCase()))
    .filter(f => activeStatus === 'Todos' || f.status?.toLowerCase().includes(activeStatus.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'reads') return b.reads_count - a.reads_count
      if (sort === 'likes') return b.likes_count - a.likes_count
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 86400) return 'Hoje'
    if (diff < 172800) return 'Ontem'
    if (diff < 604800) return `Há ${Math.floor(diff / 86400)} dias`
    if (diff < 2592000) return `Há ${Math.floor(diff / 604800)} semanas`
    return date.toLocaleDateString('pt-PT')
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Topbar title="Fanfics" />
        <div className={styles.body}>
          <div className={styles.mainCol}>
            <div className={styles.loading}>A carregar fanfics...</div>
          </div>
        </div>
      </div>
    )
  }

  if (fanfics.length === 0) {
    return (
      <div className={styles.page}>
        <Topbar title="Fanfics" />
        <div className={styles.body}>
          <div className={styles.mainCol}>
            <div className={styles.empty}>Ainda nao ha fanfics publicados.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Topbar title="Fanfics" />
      <div className={styles.body}>
        <div className={styles.mainCol}>
          <div className={styles.controls}>
            <div className={styles.genres}>
              {GENRES.map(g => (
                <button key={g} className={`${styles.chip} ${activeGenre === g ? styles.chipActive : ''}`} onClick={() => setActiveGenre(g)}>{g}</button>
              ))}
            </div>
            <div className={styles.filters}>
              <div className={styles.statusRow}>
                {STATUS.map(s => (
                  <button key={s} className={`${styles.statusBtn} ${activeStatus === s ? styles.statusActive : ''}`} onClick={() => setActiveStatus(s)}>{s}</button>
                ))}
              </div>
              <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
                <option value="recent">Mais recentes</option>
                <option value="reads">Mais lidas</option>
                <option value="likes">Mais gostadas</option>
              </select>
            </div>
          </div>

          <div className={styles.list}>
            {filtered.map(f => {
              const authorInitials = f.author?.avatar_initials || f.author?.username?.slice(0, 2).toUpperCase() || '??'
              const authorBg = '#12092a'
              const authorColor = '#9b7fff'

              return (
                <div key={f.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.genreStatus}>
                      <span className={styles.genre}>{f.genre}</span>
                      <span className={styles.status} style={{ color: STATUS_COLORS[f.status] || 'var(--text2)' }}>
                        <span className={styles.statusDot} style={{ background: STATUS_COLORS[f.status] || 'var(--text2)' }} />
                        {f.status}
                      </span>
                    </div>
                    <div className={styles.authorRow}>
                      <div className={styles.authorAvatar} style={{ background: authorBg, color: authorColor }}>{authorInitials}</div>
                      <span className={styles.authorName}>{f.author?.username || f.author?.display_name || 'Autor'}</span>
                    </div>
                  </div>
                  <h3 className={styles.cardTitle}>{f.title}</h3>
                  <p className={styles.cardSummary}>{f.summary}</p>
                  <div className={styles.cardMeta}>
                    <span><BookOpen size={13} /> {f.chapters} cap.</span>
                    <span>{f.words_count.toLocaleString()} palavras</span>
                    <span><Eye size={13} /> {fmt(f.reads_count)}</span>
                    <span><Clock size={13} /> {formatDate(f.updated_at)}</span>
                  </div>
                  <div className={styles.cardFooter}>
                    <button
                      className={`${styles.likeBtn} ${liked.has(f.id) ? styles.likeBtnActive : ''}`}
                      onClick={() => setLiked(prev => { const n = new Set(prev); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n })}
                    >
                      <Heart size={14} fill={liked.has(f.id) ? 'currentColor' : 'none'} />
                      {fmt(f.likes_count + (liked.has(f.id) ? 1 : 0))}
                    </button>
                    <button className={styles.readBtn}>Ler agora</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className={styles.rightPanel}>
          <p className={styles.panelTitle}>Top fanfics</p>
          {[...fanfics].sort((a, b) => b.reads_count - a.reads_count).slice(0, 5).map((f, i) => (
            <div key={f.id} className={styles.topItem}>
              <span className={styles.topRank}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className={styles.topTitle}>{f.title}</div>
                <div className={styles.topMeta}>{fmt(f.reads_count)} leituras · {f.author?.username || 'Autor'}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
