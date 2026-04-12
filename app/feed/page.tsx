'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Image as ImageIcon, Film, FileText, Send, Loader, X } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import PostCard from '@/components/posts/PostCard'
import { getFeed, createPost, deletePost, toggleLike } from '@/services/posts'
import { getTrending } from '@/services/trending'
import { getSuggestions } from '@/services/suggestions'
import { getEvents } from '@/services/events'
import { followUser } from '@/services/following'
import { uploadImage } from '@/services/upload'
import type { Post, TrendingTag, Profile, Event } from '@/types'

const CATEGORIES = ['Tudo', 'Shonen', 'Shojo', 'Isekai', 'Seinen', 'Cosplay', 'Manga', 'Figura', 'AMV']
const TABS = ['Geral', 'A seguir', 'Noticias', 'Anuncios']

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export default function FeedPage() {
  const { data: session } = useSession()

  const [activeCategory, setActiveCategory] = useState('Tudo')
  const [activeTab,      setActiveTab]      = useState('Geral')
  const [posts,          setPosts]          = useState<Post[]>([])
  const [loading,        setLoading]        = useState(true)
  const [composeText,    setComposeText]    = useState('')
  const [publishing,     setPublishing]     = useState(false)
  const [imageUrl,       setImageUrl]       = useState<string | null>(null)
  const [imagePreview,   setImagePreview]   = useState<string | null>(null)
  const [uploadingImg, setUploadingImg]  = useState(false)
  const [followed,       setFollowed]       = useState<Set<string>>(new Set())

  const [trending,     setTrending]     = useState<TrendingTag[]>([])
  const [suggestions,  setSuggestions]  = useState<Profile[]>([])
  const [events,       setEvents]       = useState<Event[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getFeed(1, 20, activeCategory)
      if (res.data) setPosts(res.data)
    } catch { /* keep previous */ }
    finally { setLoading(false) }
  }, [activeCategory])

  useEffect(() => { loadFeed() }, [loadFeed])

  useEffect(() => {
    Promise.all([
      getTrending(),
      getSuggestions(),
      getEvents(),
    ]).then(([tr, sg, ev]) => {
      if (tr.data) setTrending(tr.data)
      if (sg.data) setSuggestions(sg.data.slice(0, 4))
      if (ev.data) setEvents(ev.data.slice(0, 2))
    }).catch(() => {})
  }, [])

  const handleDelete = async (id: string) => {
    await deletePost(id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const handleLike = async (id: string) => {
    const post = posts.find(p => p.id === id)
    if (!post) return
    setPosts(prev => prev.map(p =>
      p.id === id
        ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1 }
        : p
    ))
    try { await toggleLike(id) } catch {
      setPosts(prev => prev.map(p =>
        p.id === id
          ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      ))
    }
  }

  const handlePublish = async () => {
    if (!composeText.trim() || publishing) return
    setPublishing(true)
    try {
      const res = await createPost({
        content: composeText.trim(),
        category: activeCategory !== ' Tudo' ? activeCategory : undefined,
        image_url: imageUrl ?? undefined,
      })
      if (res.data) {
        setPosts(prev => [res.data!, ...prev])
        setComposeText('')
        setImageUrl(null)
        setImagePreview(null)
      }
    } catch { /* ignore */ }
    finally { setPublishing(false) }
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setUploadingImg(true)
    try {
      const url = await uploadImage(file, 'posts')
      setImageUrl(url)
    } catch { setImagePreview(null) }
    finally { setUploadingImg(false) }
    e.target.value = ''
  }

  const handleFollow = async (userId: string, username: string) => {
    setFollowed(prev => {
      const next = new Set(prev)
      next.has(username) ? next.delete(username) : next.add(username)
      return next
    })
    try { await followUser(userId) } catch { /* ignore */ }
  }

  const initials   = session?.user?.avatar_initials || session?.user?.name?.slice(0, 2).toUpperCase() || '??'
  const firstName  = session?.user?.name?.split(' ')[0] || 'utilizador'

  return (
    <div className="feed-page">
      <Topbar title="Feed" />

      <div className="feed-body">
        <div className="feed-col">

          <div className="feed-compose">
            <div className="feed-compose-top">
              <div className="feed-compose-avatar">{initials}</div>
              <div
                className="feed-compose-input"
                contentEditable
                suppressContentEditableWarning
                onInput={e => setComposeText((e.target as HTMLDivElement).textContent ?? '')}
                data-placeholder={`O que estas a pensar, ${firstName}?`}
              />
            </div>

            {imagePreview && (
              <div className="feed-image-preview-wrap">
                <img src={imagePreview} alt="Preview" className="feed-image-preview" />
                {uploadingImg && (
                  <div className="feed-image-preview-overlay">
                    <Loader size={20} className="spin" />
                  </div>
                )}
                <button className="feed-image-remove-btn" onClick={() => { setImageUrl(null); setImagePreview(null) }}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="feed-compose-actions">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleImagePick} />
              <button className="feed-compose-btn" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={15} /> Imagem
              </button>
              <button className="feed-compose-btn"><Film size={15} /> Video</button>
              <button className="feed-compose-btn"><FileText size={15} /> Artigo</button>
              <button className="feed-submit-btn" onClick={handlePublish} disabled={publishing || !composeText.trim() || uploadingImg}>
                {publishing ? <Loader size={14} className="spin" /> : <Send size={14} />}
                Publicar
              </button>
            </div>
          </div>

          <div className="feed-chips">
            {CATEGORIES.map(c => (
              <button key={c} className={`feed-chip ${activeCategory === c ? 'feed-chip-active' : ''}`} onClick={() => setActiveCategory(c)}>
                {c}
              </button>
            ))}
          </div>

          <div className="feed-tabs">
            {TABS.map(t => (
              <button key={t} className={`feed-tab ${activeTab === t ? 'feed-tab-active' : ''}`} onClick={() => setActiveTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="feed-loading-state"><Loader size={24} className="spin" /></div>
          ) : posts.length === 0 ? (
            <p className="feed-empty-state">Nenhuma publicacao por aqui ainda.</p>
          ) : (
            <div className="feed-posts">
              {posts.map((post, i) => (
                <div key={post.id} className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 4)}`}>
                  <PostCard
                    post={post}
                    onDelete={session?.user?.id === post.author_id || (session?.user as any)?.role === 'mod' || (session?.user as any)?.role === 'superuser' ? handleDelete : undefined}
                    onLike={handleLike}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="feed-right-panel">
          {trending.length > 0 && (
            <div className="feed-panel-section">
              <p className="feed-panel-title">Em destaque</p>
              {trending.map((t, i) => (
                <div key={t.id} className="feed-trending-item">
                  <span className="feed-trending-rank">{i + 1}</span>
                  <div>
                    <div className="feed-trending-tag">#{t.tag}</div>
                    <div className="feed-trending-count">{t.post_count.toLocaleString('pt')} posts</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="feed-panel-section">
              <p className="feed-panel-title">Sugestoes</p>
              {suggestions.map(u => (
                <div key={u.id} className="feed-sugg-user">
                  <div className="feed-sugg-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                    {u.avatar_initials}
                  </div>
                  <div className="feed-sugg-info">
                    <div className="feed-sugg-name">{u.display_name}</div>
                    <div className="feed-sugg-handle">@{u.username} · {fmt(u.followers_count || 0)} seguidores</div>
                  </div>
                  <button className={`feed-follow-btn ${followed.has(u.username) ? 'feed-following-btn-feed' : ''}`} onClick={() => handleFollow(u.id, u.username)}>
                    {followed.has(u.username) ? 'A seguir' : 'Seguir'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {events.length > 0 && (
            <div className="feed-panel-section">
              <p className="feed-panel-title">Proximos eventos</p>
              {events.map(ev => {
                const d = new Date(ev.date)
                const label = d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
                return (
                  <div key={ev.id} className="feed-event-card">
                    <div className="feed-event-date" style={{ color: ev.date_color ?? 'var(--accent2)' }}>{label}</div>
                    <div className="feed-event-title">{ev.title}</div>
                    <div className="feed-event-count">{ev.interested_count.toLocaleString('pt')} interessados</div>
                  </div>
                )
              })}
            </div>
          )}

          <p className="feed-panel-footer">
            Termos · Privacidade · Sobre · Ajuda<br />
            <span>PORTAL Beta © 2026 · Jerry Alafo</span>
          </p>
        </aside>
      </div>
    </div>
  )
}