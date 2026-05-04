'use client'

import { useState, useEffect } from 'react'
import { Heart, Eye, Clock, Plus, X, Share2 } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { useToast } from '@/hooks/useToast'
import { toggleFanficLike } from '@/services/fanfics'
import { useGuestMode } from '@/components/layout/GuestModeProvider'
import styles from './page.module.css'

const GENRES = ['Tudo', 'Isekai', 'Shonen', 'Shojo', 'Seinen', 'Romance', 'Aventura', 'Comedia']
const STATUS = ['Todos', 'Em curso', 'Completo', 'Pausado']

interface Fanfic {
  id: string
  title: string
  summary: string
  synopsis?: string
  genre: string
  fandom: string
  status: string
  chapters: number
  words: number
  author_id: string
  likes_count: number
  reads_count: number
  created_at: string
  updated_at: string
  liked_by_me?: boolean
  author?: {
    id: string
    username: string
    display_name: string
    avatar_initials: string
    avatar_url?: string
  }
}

const STATUS_COLORS: Record<string, string> = {
  'ongoing': 'var(--green)',
  'complete': 'var(--accent2)',
  'hiatus': 'var(--amber)',
}

const STATUS_LABELS: Record<string, string> = {
  'ongoing': 'Em curso',
  'complete': 'Completo',
  'hiatus': 'Pausado',
}

export default function FanficsPage() {
  const { showToast } = useToast()
  const { isGuest, requestLogin } = useGuestMode()
  const [activeGenre, setActiveGenre] = useState('Tudo')
  const [activeStatus, setActiveStatus] = useState('Todos')
  const [fanfics, setFanfics] = useState<Fanfic[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'recent' | 'reads' | 'likes'>('recent')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [likingFanfics, setLikingFanfics] = useState<Set<string>>(new Set())
  const [showReadModal, setShowReadModal] = useState<Fanfic | null>(null)
  const [newFanfic, setNewFanfic] = useState({
    title: '',
    summary: '',
    fandom: '',
    genre: '',
    status: 'Em curso',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fanficsRes = await fetch('/api/fanfics')
        const fanficsData = await fanficsRes.json()

        if (fanficsRes.status === 401) {
          showToast('Precisas de login para ver as fanfics', 'error')
          setFanfics([])
        } else if (fanficsData.data) {
          setFanfics(fanficsData.data)
        }
      } catch (err) {
        console.error('Erro ao carregar fanfics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = fanfics
    .filter(f => activeGenre === 'Tudo' || f.genre?.toLowerCase().includes(activeGenre.toLowerCase()))
    .filter(f => {
      if (activeStatus === 'Todos') return true
      const statusMap: Record<string, string> = {
        'Em curso': 'ongoing',
        'Completo': 'complete',
        'Pausado': 'hiatus',
      }
      return f.status === statusMap[activeStatus]
    })
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

  const requireLogin = (detail?: { title?: string; message?: string; returnTo?: string }) => {
    if (!isGuest) return true

    requestLogin(detail)
    return false
  }

  const handleLike = async (fanficId: string) => {
    if (!requireLogin({
      title: 'Like protegido',
      message: 'Entra na tua conta para gostar de fanfics.',
    })) return

    const fanfic = fanfics.find(f => f.id === fanficId)
    if (!fanfic) return

    // Optimistic update
    setFanfics(prev => prev.map(f =>
      f.id === fanficId
        ? { ...f, liked_by_me: !f.liked_by_me, likes_count: f.liked_by_me ? f.likes_count - 1 : f.likes_count + 1 }
        : f
    ))

    try {
      await toggleFanficLike(fanficId)
    } catch (err) {
      console.error('Erro ao dar like:', err)
      // Revert optimistic update
      setFanfics(prev => prev.map(f =>
        f.id === fanficId
          ? { ...f, liked_by_me: !f.liked_by_me, likes_count: f.liked_by_me ? f.likes_count - 1 : f.likes_count + 1 }
          : f
      ))
      showToast('Erro ao dar like', 'error')
    }
  }

  const handleShare = async (fanfic: Fanfic) => {
    const url = `${window.location.origin}/fanfics/${fanfic.id}`
    const text = `Confira esta fanfic: "${fanfic.title}" no PORTAL`

    if (navigator.share) {
      try {
        await navigator.share({
          title: fanfic.title,
          text,
          url,
        })
      } catch {
        // User cancelled or not supported
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        showToast('Link copiado!', 'success')
      } catch {
        showToast('Erro ao copiar link', 'error')
      }
    }
  }

  const handleReadNow = (fanfic: Fanfic) => {
    if (!fanfic.summary && !fanfic.synopsis) {
      showToast('Esta fanfic ainda não tem conteúdo.', 'info')
      return
    }
    setShowReadModal(fanfic)
  }

  const handleCreateFanfic = async () => {
    if (!requireLogin({
      title: 'Publicacao protegida',
      message: 'Entra ou cria uma conta para publicar fanfics.',
    })) return

    if (!newFanfic.title.trim() || !newFanfic.summary.trim() || creating) return

    if (!newFanfic.fandom.trim()) {
      showToast('Fandom é obrigatório', 'error')
      return
    }
    if (!newFanfic.genre.trim()) {
      showToast('Género é obrigatório', 'error')
      return
    }

    setCreating(true)
    try {
      const payload = {
        title: newFanfic.title.trim(),
        summary: newFanfic.summary.trim(),
        fandom: newFanfic.fandom.trim(),
        genre: newFanfic.genre.trim(),
        status: newFanfic.status,
      }
      const res = await fetch('/api/fanfics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.error) {
        showToast(json.error, 'error')
        setCreating(false)
        return
      }
      if (json.data) {
        setFanfics((prev) => [json.data, ...prev])
        setShowCreateModal(false)
        showToast('Fanfic publicada!', 'success')
        setNewFanfic({
          title: '',
          summary: '',
          fandom: '',
          genre: '',
          status: 'Em curso',
        })
      }
    } catch (err) {
      console.error(err)
      showToast('Erro ao criar fanfic', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handlePickAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder - attachment feature not supported
    e.target.value = ''
  }

  const CreateModal = showCreateModal ? (
    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>Nova fanfic</h3>
<button className="modal-close" onClick={() => setShowCreateModal(false)}>
              <X size={18} />
            </button>
        </div>
        <div className="modal-body" style={{ padding: 16, display: 'grid', gap: 12 }}>
          <input className="modal-input" placeholder="Título da fanfic" value={newFanfic.title} onChange={(e) => setNewFanfic((p) => ({ ...p, title: e.target.value }))} />
          <textarea className="modal-textarea" placeholder="Conte a história" value={newFanfic.summary} onChange={(e) => setNewFanfic((p) => ({ ...p, summary: e.target.value }))} rows={8} maxLength={6000} />
          <input className="modal-input" placeholder="Fandom (ex: Naruto, Harry Potter)" value={newFanfic.fandom} onChange={(e) => setNewFanfic((p) => ({ ...p, fandom: e.target.value }))} />
          <input className="modal-input" placeholder="Género (ex: Romance, Aventura)" value={newFanfic.genre} onChange={(e) => setNewFanfic((p) => ({ ...p, genre: e.target.value }))} />
          <select className="modal-input" value={newFanfic.status} onChange={(e) => setNewFanfic((p) => ({ ...p, status: e.target.value }))}>
            <option value="Em curso">Em curso</option>
            <option value="Completo">Completo</option>
            <option value="Pausado">Pausado</option>
          </select>
        </div>
        <div className="modal-footer">
          <button className="modal-ok-btn" onClick={handleCreateFanfic} disabled={creating}>
            {creating ? 'A publicar...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  if (loading) {
    return (
      <>
      <div className={styles.page}>
        <Topbar title="Fanfics" />
        <div className={styles.body}>
          <div className={styles.mainCol}>
            <div className={styles.loading}>A carregar fanfics...</div>
          </div>
        </div>
      </div>
      {CreateModal}
      </>
    )
  }

  return (
    <>
    <div className={styles.page}>
      <Topbar title="Fanfics" />
      <div className={styles.body}>
        <div className={styles.mainCol}>
          <div className={styles.controls}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                className={styles.readBtn}
                onClick={() => requireLogin({
                  title: 'Publicacao protegida',
                  message: 'Entra ou cria uma conta para publicar fanfics.',
                }) && setShowCreateModal(true)}
              >
                <Plus size={14} /> Publicar fanfic
              </button>
            </div>
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
            {filtered.length === 0 ? (
              <div className={styles.empty}>Nenhuma fanfic encontrada com os filtros aplicados.</div>
            ) : (
              filtered.map(f => {
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
                          {STATUS_LABELS[f.status] || f.status}
                        </span>
                      </div>
                      <div className={styles.authorRow}>
                        <div className={styles.authorAvatar} style={{ background: authorBg, color: authorColor }}>{authorInitials}</div>
                        <span className={styles.authorName}>{f.author?.username || f.author?.display_name || 'Autor'}</span>
                      </div>
                    </div>
                    <h3 className={styles.cardTitle}>{f.title}</h3>
                    <div className={styles.cardMeta}>
                      <span>{(f.words ?? 0).toLocaleString()} palavras</span>
                      <span><Eye size={13} /> {fmt(f.reads_count)}</span>
                      <span><Clock size={13} /> {formatDate(f.updated_at)}</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <button
                        className={`${styles.likeBtn} ${f.liked_by_me ? styles.likeBtnActive : ''}`}
                        onClick={() => handleLike(f.id)}                      disabled={likingFanfics.has(f.id)}                      >
                        <Heart size={14} fill={f.liked_by_me ? 'currentColor' : 'none'} />
                        {fmt(f.likes_count)}
                      </button>
                      <button className={styles.readBtn} onClick={() => handleReadNow(f)}>
                        Ler agora
                      </button>
                      <button className={styles.shareBtn} onClick={() => handleShare(f)}>
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <aside className={styles.rightPanel}>
          <p className={styles.panelTitle}>Top fanfics</p>
          {fanfics.length === 0 ? (
            <p className={styles.empty}>Nenhuma fanfic ainda.</p>
          ) : (
            [...fanfics].sort((a, b) => b.reads_count - a.reads_count).slice(0, 5).map((f, i) => (
              <div key={f.id} className={styles.topItem}>
                <span className={styles.topRank}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className={styles.topTitle}>{f.title}</div>
                  <div className={styles.topMeta}>{fmt(f.reads_count)} leituras · {f.author?.username || 'Autor'}</div>
                </div>
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
    {CreateModal}
    {showReadModal && (
      <div className="modal-overlay" onClick={() => setShowReadModal(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '85vh' }}>
          <div className="modal-header">
            <h3>{showReadModal.title}</h3>
            <button className="modal-close" onClick={() => setShowReadModal(null)}>
              <X size={18} />
            </button>
          </div>
          <div className="modal-body" style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span className={styles.genre}>{showReadModal.genre}</span>
                <span className={styles.status} style={{ color: STATUS_COLORS[showReadModal.status] || 'var(--text2)' }}>
                  <span className={styles.statusDot} style={{ background: STATUS_COLORS[showReadModal.status] || 'var(--text2)' }} />
                  {STATUS_LABELS[showReadModal.status] || showReadModal.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--text3)', marginBottom: 16 }}>
                <span>{(showReadModal.words ?? 0).toLocaleString()} palavras</span>
                <span><Eye size={14} style={{ marginRight: 4 }} />{fmt(showReadModal.reads_count)} leituras</span>
              </div>
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
              {showReadModal.synopsis || showReadModal.summary}
            </div>
          </div>
          <div className="modal-footer">
            <button className="modal-cancel-btn" onClick={() => setShowReadModal(null)}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
