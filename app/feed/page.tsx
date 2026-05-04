'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Image as ImageIcon, Film, FileText, Send, Loader, X, AlertTriangle } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import PostCard from '@/components/posts/PostCard'
import { getFeed, createPost, deletePost, toggleLike } from '@/services/posts'
import { getTrending } from '@/services/trending'
import { getSuggestions } from '@/services/suggestions'
import { getEvents } from '@/services/events'
import { toggleFollow } from '@/services/following'
import { uploadImage } from '@/services/upload'
import FeatureUnavailableModal from '@/components/ui/FeatureUnavailableModal'
import { useGuestMode } from '@/components/layout/GuestModeProvider'
import type { Post, TrendingTag, Profile, Event } from '@/types'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

const CATEGORIES = ['Tudo', 'Shonen', 'Shojo', 'Isekai', 'Seinen', 'Cosplay', 'Manga', 'Figura', 'AMV', 'Outro']
const TABS = ['Geral', 'A seguir', 'Sugestoes', 'Anuncios']

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export default function FeedPage() {
  const { data: session } = useSession()
  const { isGuest, requestLogin } = useGuestMode()

  const [activeCategory, setActiveCategory] = useState('Tudo')
  const [activeTab,      setActiveTab]      = useState('Geral')
  const [posts,          setPosts]          = useState<Post[]>([])
  const [loading,        setLoading]        = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [composeText,    setComposeText]    = useState('')
  const [publishing,     setPublishing]     = useState(false)
  const [publishError, setPublishError] = useState<string>('')
  const [showPublishErrorModal, setShowPublishErrorModal] = useState(false)
  const [imageUrl,       setImageUrl]       = useState<string | null>(null)
  const [imagePreview,   setImagePreview]   = useState<string | null>(null)
  const [uploadingImg, setUploadingImg]  = useState(false)
  const [composeCategory, setComposeCategory] = useState<string>('Outro')
   const [composeSpoiler, setComposeSpoiler] = useState(false)
   const [composeSensitive, setComposeSensitive] = useState(false)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [followed,       setFollowed]       = useState<Set<string>>(new Set())

  const [trending,     setTrending]     = useState<TrendingTag[]>([])
  const [suggestions,  setSuggestions]  = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const composeRef = useRef<HTMLDivElement>(null)

  const requireLogin = useCallback((detail?: { title?: string; message?: string; returnTo?: string }) => {
    if (!isGuest) return true

    requestLogin(detail)
    return false
  }, [isGuest, requestLogin])

  const loadPage = useCallback(async (targetPage: number, append: boolean) => {
    let filter: string | undefined
    let category: string | undefined

    if (activeTab === 'A seguir') {
      filter = 'following'
    } else if (activeTab === 'Noticias') {
      category = 'Noticias'
    } else if (activeTab === 'Anuncios') {
      category = 'Anuncios'
    } else {
      category = activeCategory !== 'Tudo' ? activeCategory : undefined
    }

    const res = await getFeed(targetPage, 20, category, filter)
    const nextPosts = res.data ?? []
    setHasMore(nextPosts.length === 20)
    setPage(targetPage)
    setPosts((prev) => (append ? [...prev, ...nextPosts] : nextPosts))
  }, [activeCategory, activeTab])

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      await loadPage(1, false)
    } catch { /* keep previous */ }
    finally { setLoading(false) }
  }, [loadPage])

  useEffect(() => { loadFeed() }, [loadFeed])

  const handleLoadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      await loadPage(page + 1, true)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadPage, loading, loadingMore, page])

  const sentinelRef = useInfiniteScroll({
    enabled: true,
    hasMore,
    isLoading: loading || loadingMore,
    onLoadMore: handleLoadMore,
  })

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
    if (!requireLogin({
      title: 'Like protegido',
      message: 'Entra na tua conta para guardar gostos e interagir com publicacoes.',
    })) return

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
    if (!requireLogin({
      title: 'Publicacao protegida',
      message: 'Entra ou cria uma conta para publicar no PORTAL.',
    })) return

    if (!composeText.trim() || publishing) return
    setPublishing(true)
    setPublishError('')
    try {
      const normalizedCategory = composeCategory?.trim()
      const res = await createPost({
        content: composeText.trim(),
        category: normalizedCategory && normalizedCategory !== 'Tudo' ? normalizedCategory : undefined,
        image_url: imageUrl ?? undefined,
        is_spoiler: composeSpoiler,
        is_sensitive: composeSensitive,
      })
      if (res.error) {
        setPublishError(res.error)
        setShowPublishErrorModal(true)
        return
      }
      if (res.data) {
        setPosts(prev => [res.data!, ...prev])
        setComposeText('')
        if (composeRef.current) {
          composeRef.current.textContent = ''
        }
        setImageUrl(null)
        setImagePreview(null)
        setComposeCategory('Outro')
        setComposeSpoiler(false)
        setComposeSensitive(false)
      }
    } catch { /* ignore */ }
    finally { setPublishing(false) }
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!requireLogin({
      title: 'Upload protegido',
      message: 'Entra na tua conta para anexar imagens e publicar.',
    })) {
      e.target.value = ''
      return
    }

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
    if (!requireLogin({
      title: 'Seguir requer login',
      message: 'Entra na tua conta para seguir membros e montar o teu feed.',
    })) return

    setFollowed(prev => {
      const next = new Set(prev)
      if (next.has(username)) {
        next.delete(username)
      } else {
        next.add(username)
      }
      return next
    })
    try {
      const { data } = await toggleFollow(userId)
      if (data?.following === false) {
        setFollowed(prev => {
          const next = new Set(prev)
          next.delete(username)
          return next
        })
      }
    } catch {
      // Revert on error
      setFollowed(prev => {
        const next = new Set(prev)
        if (next.has(username)) {
          next.delete(username)
        } else {
          next.add(username)
        }
        return next
      })
    }
  }

  const sessionRole = (session?.user as { role?: string } | undefined)?.role
  const initials   = session?.user?.avatar_initials || session?.user?.name?.slice(0, 2).toUpperCase() || '??'
  const firstName  = session?.user?.name?.split(' ')[0] || 'utilizador'
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return
      try {
        const res = await fetch(`/api/users/${session.user.id}/profile`)
        const data = await res.json()
        if (data.profile?.avatar_url) {
          setProfileAvatar(data.profile.avatar_url)
        }
      } catch { /* ignore */ }
    }
    fetchProfile()
  }, [session])

  const avatarUrl = profileAvatar || (session?.user as { avatar_url?: string })?.avatar_url

  return (
    <>
    <div className="feed-page">
      <Topbar title="Feed" />

      <FeatureUnavailableModal
        open={showPublishErrorModal}
        onClose={() => setShowPublishErrorModal(false)}
        title="Erro ao publicar"
        description={publishError || 'Não foi possível publicar agora.'}
      />

      <div className="feed-body">
        <div className="feed-col">

          <div className="feed-compose">
            <div className="feed-compose-top">
              <div className="feed-compose-avatar">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : initials}
              </div>
              <div
                ref={composeRef}
                className="feed-compose-input"
                contentEditable={!isGuest}
                suppressContentEditableWarning
                onClick={() => {
                  if (isGuest) {
                    requestLogin({
                      title: 'Publicacao protegida',
                      message: 'Entra ou cria uma conta para publicar no PORTAL.',
                    })
                  }
                }}
                onFocus={() => {
                  if (isGuest) {
                    requestLogin({
                      title: 'Publicacao protegida',
                      message: 'Entra ou cria uma conta para publicar no PORTAL.',
                    })
                  }
                }}
                onInput={e => setComposeText((e.target as HTMLDivElement).textContent ?? '')}
                data-placeholder={isGuest ? 'Entra para publicar no PORTAL' : `O que estas a pensar, ${firstName}?`}
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
              <button className="feed-compose-btn" onClick={() => {
                if (requireLogin({
                  title: 'Upload protegido',
                  message: 'Entra na tua conta para anexar imagens e publicar.',
                })) {
                  fileInputRef.current?.click()
                }
              }}>
                <ImageIcon size={15} /> Imagem
              </button>
              <button className="feed-compose-btn" onClick={() => requireLogin() && setShowFeatureModal(true)}><Film size={15} /> Video</button>
              <button className="feed-compose-btn" onClick={() => requireLogin() && setShowFeatureModal(true)}><FileText size={15} /> Artigo</button>
              <select className="feed-compose-select" value={composeCategory} onChange={e => setComposeCategory(e.target.value)}>
                {CATEGORIES.filter(c => c !== 'Tudo').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                className={`feed-compose-btn ${composeSpoiler ? 'feed-compose-btn-active' : ''}`}
                onClick={() => requireLogin() && setComposeSpoiler(v => !v)}
                title="Marcar como spoiler"
              >
                <AlertTriangle size={15} /> Spoiler
              </button>
              <button
                type="button"
                className={`feed-compose-btn ${composeSensitive ? 'feed-compose-btn-sensitive' : ''}`}
                onClick={() => requireLogin() && setComposeSensitive(v => !v)}
                title="Marcar como conteúdo sensível"
              >
                <AlertTriangle size={15} /> Sensível
              </button>
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
              <button
                key={t}
                className={`feed-tab ${activeTab === t ? 'feed-tab-active' : ''}`}
                onClick={() => {
                  if (t === 'A seguir' && !requireLogin({
                    title: 'Feed pessoal protegido',
                    message: 'Entra na tua conta para veres publicacoes de quem segues.',
                    returnTo: '/seguindo',
                  })) return
                  setActiveTab(t)
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {activeTab === 'Sugestoes' ? (
            <div className="feed-suggestions-list">
              <p className="feed-panel-title" style={{ marginBottom: '16px' }}>Sugestoes para ti</p>
              {suggestions.length > 0 ? suggestions.map(u => (
                <div key={u.id} className="feed-sugg-user">
                  <div className="feed-sugg-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt={u.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : u.avatar_initials}
                  </div>
                  <div className="feed-sugg-info">
                    <div className="feed-sugg-name">{u.display_name}</div>
                    <div className="feed-sugg-handle">@{u.username} · {fmt(u.followers_count || 0)} seguidores</div>
                  </div>
                  <button className={`feed-follow-btn ${followed.has(u.username) ? 'feed-following-btn-feed' : ''}`} onClick={() => handleFollow(u.id, u.username)}>
                    {followed.has(u.username) ? 'A seguir' : 'Seguir'}
                  </button>
                </div>
              )) : (
                <p className="feed-empty-state">Sem sugestoes por agora.</p>
              )}
            </div>
          ) : loading ? (
            <div className="feed-loading-state"><Loader size={24} className="spin" /></div>
          ) : posts.length === 0 ? (
            <p className="feed-empty-state">Nenhuma publicacao por aqui ainda.</p>
          ) : (
            <div className="feed-posts">
              {posts.map((post, i) => (
                <div key={post.id} className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 4)}`}>
                  <PostCard
                    post={post}
                    onDelete={session?.user?.id === post.author_id || sessionRole === 'mod' || sessionRole === 'superuser' ? handleDelete : undefined}
                    onLike={handleLike}
                  />
                </div>
              ))}
              {hasMore && (
                <div ref={sentinelRef} className="feed-loading-state">
                  {loadingMore ? <Loader size={20} className="spin" /> : null}
                </div>
              )}
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
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt={u.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : u.avatar_initials}
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

    <FeatureUnavailableModal
      open={showFeatureModal}
      onClose={() => setShowFeatureModal(false)}
      hint="Estamos a preparar suporte a publicações em vídeo e artigos completos."
    />
    </>
  )
}
