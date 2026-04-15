'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { MapPin, Link2, Calendar, MoreHorizontal, Share2, Edit3, Loader2, Check } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { uploadImage } from '@/services/upload'
import FeatureUnavailableModal from '@/components/ui/FeatureUnavailableModal'

const TABS = ['Publicacoes', 'Galeria', 'Gostos', 'Fanfics']

interface Post {
  id: string
  content: string
  category: string | null
  image_url: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  liked_by_me: boolean
  created_at: string
  author: {
    id: string
    username: string
    display_name: string
    avatar_initials: string
    avatar_url: string | null
    role: string
  }
}

interface Fanfic {
  id: string
  title: string
  synopsis: string | null
  summary?: string | null
  fandom: string | null
  genre: string | null
  status: string
  chapters: number
  words: number
  reads_count: number
  likes_count: number
  created_at: string
  updated_at: string
}

interface GalleryItem {
  id: string
  title: string | null
  image_url: string
  likes_count: number
  created_at: string
}

interface Profile {
  id: string
  username: string
  display_name: string
  avatar_initials: string | null
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  role: string
  level: number
  posts_count: number
  followers_count: number
  following_count: number
  likes_received_count: number
  created_at: string
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mes`
}

function getRoleBadge(role: string) {
  if (role === 'superuser') return <span className="perfil-badge-su">Super User</span>
  if (role === 'mod') return <span className="perfil-badge-mod">Moderador</span>
  return null
}

export default function PerfilPage() {
  const { data: session, update: updateSession } = useSession()
  const [activeTab, setActiveTab] = useState('Publicacoes')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [fanfics, setFanfics] = useState<Fanfic[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [tabPage, setTabPage] = useState(1)
  const [tabHasMore, setTabHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const userId = session?.user?.id

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/users/${userId}/profile?tab=posts&limit=20`)
        const json = await res.json()
        if (json.profile) {
          setProfile(json.profile)
          setPosts(json.data || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [userId])

  const loadTabData = useCallback(async (page: number, append: boolean) => {
    if (!userId || !profile) return
    try {
      const tabMap: Record<string, string> = {
        Publicacoes: 'posts',
        Fanfics: 'fanfics',
        Galeria: 'gallery',
        Gostos: 'likes',
      }
      const tab = tabMap[activeTab]
      if (!tab) {
        setTabHasMore(false)
        return
      }

      const res = await fetch(`/api/users/${userId}/profile?tab=${tab}&page=${page}&limit=20`)
      const json = await res.json()
      const next = json.data || []

      setTabPage(page)
      setTabHasMore(Boolean(json.hasMore))

      if (activeTab === 'Publicacoes' || activeTab === 'Gostos') {
        setPosts((prev) => (append ? [...prev, ...next] : next))
      } else if (activeTab === 'Fanfics') {
        setFanfics((prev) => (append ? [...prev, ...next] : next))
      } else if (activeTab === 'Galeria') {
        setGallery((prev) => (append ? [...prev, ...next] : next))
      }
    } catch (e) {
      console.error(e)
    }
  }, [activeTab, profile, userId])

  useEffect(() => {
    setTabPage(1)
    setTabHasMore(true)
    setPosts([])
    setFanfics([])
    setGallery([])
    void loadTabData(1, false)
  }, [activeTab, loadTabData])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !tabHasMore || loading) return
    setLoadingMore(true)
    try {
      await loadTabData(tabPage + 1, true)
    } finally {
      setLoadingMore(false)
    }
  }, [loadTabData, loading, loadingMore, tabHasMore, tabPage])

  const sentinelRef = useInfiniteScroll({
    enabled: true,
    hasMore: tabHasMore,
    isLoading: loading || loadingMore,
    onLoadMore: handleLoadMore,
  })

  const handleShareProfile = async () => {
    const profileUsername = profile?.username || session?.user?.username
    if (!profileUsername) return
    const url = `${window.location.origin}/perfil/${profileUsername}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.display_name || session?.user?.name} no PORTAL`,
          text: profile?.bio || 'Vê o meu perfil no PORTAL',
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch { /* ignore */ }
  }

  const updateProfileMedia = async (key: 'avatar_url' | 'cover_url', file: File) => {
    const bucket = key === 'cover_url' ? 'covers' : 'avatars'
    const url = await uploadImage(file, bucket)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: url }),
    })
    const json = await res.json()
    if (json?.data) {
      setProfile((prev) => (prev ? { ...prev, [key]: url } : prev))
      if (key === 'avatar_url' && profile?.id) {
        localStorage.setItem(`user_avatar_${profile.id}`, url)
        window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { avatar_url: url, user_id: profile.id } }))
      }
    }
  }

  const handlePickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || uploadingAvatar) return
    setUploadingAvatar(true)
    try { await updateProfileMedia('avatar_url', file) } catch { /* ignore */ }
    finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handlePickBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || uploadingBanner) return
    setUploadingBanner(true)
    try { await updateProfileMedia('cover_url', file) } catch { /* ignore */ }
    finally {
      setUploadingBanner(false)
      e.target.value = ''
    }
  }

  if (!session) {
    return (
      <div className="perfil-page">
        <Topbar title="Perfil" />
        <div className="perfil-body">
          <p style={{ color: 'var(--text3)', textAlign: 'center', padding: 40 }}>
            A carregar...
          </p>
        </div>
      </div>
    )
  }

  if (loading && !profile) {
    return (
      <div className="perfil-page">
        <Topbar title="Perfil" />
        <div className="perfil-body" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Loader2 size={32} className="spin" />
        </div>
      </div>
    )
  }

  const initials = profile?.avatar_initials || session?.user?.name?.slice(0, 2).toUpperCase() || '??'
  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) : ''

  return (
    <>
    <div className="perfil-page">
      <Topbar title="Perfil" />

      <div className="perfil-body">
        <div className="perfil-main-col">

          {/* Banner */}
          <div className="perfil-banner">
            {profile?.cover_url ? <img src={profile.cover_url} alt="Banner do perfil" className="perfil-banner-image" /> : null}
            <div className="perfil-banner-overlay" />
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handlePickBanner}
            />
            <button className="perfil-banner-edit-btn" onClick={() => bannerInputRef.current?.click()}>
              {uploadingBanner ? <Loader2 size={12} className="spin" /> : <Edit3 size={12} />} Editar banner
            </button>
          </div>

          {/* Info area */}
          <div className="perfil-info-area">
            <div className="perfil-avatar-row">
              <div className="perfil-avatar-wrap">
                <div className="perfil-avatar">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.display_name || 'Avatar'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : initials}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handlePickAvatar}
                />
                <button className="perfil-avatar-edit-btn" onClick={() => avatarInputRef.current?.click()}>
                  {uploadingAvatar ? <Loader2 size={12} className="spin" /> : <Edit3 size={12} />}
                </button>
              </div>
              <div className="perfil-name-meta">
                <div className="perfil-name">
                  {profile?.display_name || session.user.name}
                  {getRoleBadge(profile?.role || 'member')}
                </div>
                <div className="perfil-handle">@{profile?.username || session.user.username} · Membro desde {joinDate}</div>
                <div className="perfil-badges">
                  {profile?.role === 'superuser' && <span className="perfil-badge-su">Super User</span>}
                  {profile?.level && <span className="perfil-badge-level">Nivel {profile.level}</span>}
                </div>
              </div>
              <div className="perfil-profile-actions">
                <button className="perfil-icon-btn" onClick={handleShareProfile}>
                  {copied ? <Check size={14} /> : <Share2 size={14} />}
                </button>
                <div style={{ position: 'relative' }}>
                  <button className="perfil-icon-btn" onClick={() => setMenuOpen((prev) => !prev)}><MoreHorizontal size={14} /></button>
                  {menuOpen && (
                    <div className="post-menu-perfil" style={{ right: 0, top: 'calc(100% + 8px)' }}>
                      <button className="post-menu-item-perfil" onClick={() => { setMenuOpen(false); handleShareProfile() }}>Copiar link do perfil</button>
                      <button className="post-menu-item-perfil" onClick={() => { setMenuOpen(false); setShowFeatureModal(true) }}>Editar dados avançados</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="perfil-bio">
              {profile?.bio || 'Sem bio ainda.'}
            </p>

            <div className="perfil-details">
              {profile?.location && (
                <span className="perfil-detail"><MapPin size={13} /> {profile.location}</span>
              )}
              {profile?.website && (
                <span className="perfil-detail"><Link2 size={13} /> {profile.website}</span>
              )}
              <span className="perfil-detail"><Calendar size={13} /> Juntou-se em {joinDate}</span>
            </div>

            <div className="perfil-stats">
              <div className="perfil-stat">
                <span className="perfil-stat-num">{fmt(profile?.posts_count || 0)}</span>
                <span className="perfil-stat-label">Publicacoes</span>
              </div>
              <div className="perfil-stat">
                <span className="perfil-stat-num">{fmt(profile?.followers_count || 0)}</span>
                <span className="perfil-stat-label">Seguidores</span>
              </div>
              <div className="perfil-stat">
                <span className="perfil-stat-num">{fmt(profile?.following_count || 0)}</span>
                <span className="perfil-stat-label">A seguir</span>
              </div>
              <div className="perfil-stat">
                <span className="perfil-stat-num">{fmt(profile?.likes_received_count || 0)}</span>
                <span className="perfil-stat-label">Gostos recebidos</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="perfil-tabs">
            {TABS.map(t => (
              <button
                type="button"
                key={t}
                className={`perfil-tab ${activeTab === t ? 'perfil-tab-active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'Publicacoes' && (
            <div className="perfil-posts-col">
              {posts.length === 0 ? (
                <p className="perfil-empty-tab">Ainda nao ha publicacoes.</p>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <Link href={`/perfil/${post.author.username}`} className="post-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        {post.author.avatar_url
                          ? <img src={post.author.avatar_url} alt={post.author.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : post.author.avatar_initials}
                      </Link>
                      <div className="post-author-info">
                        <Link href={`/perfil/${post.author.username}`} className="post-author-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                          {post.author.display_name}
                          {post.author.role === 'superuser' && <span className="post-badge-su">Super User</span>}
                          {post.author.role === 'mod' && <span className="post-badge-mod">Moderador</span>}
                        </Link>
                        <div className="post-meta">
                          <Link href={`/perfil/${post.author.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>@{post.author.username}</Link>
                          <span>{timeAgo(post.created_at)}</span>
                          {post.category && <span>{post.category}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="post-body">
                      <p className="post-text">{post.content}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="Imagem do post" style={{ maxWidth: '100%', borderRadius: 'var(--radius)', marginTop: 12, maxHeight: 300, objectFit: 'cover' }} />
                      )}
                    </div>
                  </div>
                ))
              )}
              {tabHasMore && (
                <div ref={sentinelRef} className="feed-loading-state">
                  {loadingMore ? <Loader2 size={18} className="spin" /> : null}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Galeria' && (
            <div className="perfil-gallery-grid">
              {gallery.length === 0 ? (
                <p className="perfil-empty-tab">Ainda nao ha imagens na galeria.</p>
              ) : (
                gallery.map(item => (
                  <div key={item.id} className="perfil-gallery-cell">
                    <img src={item.image_url} alt={item.title || 'Imagem'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))
              )}
              {tabHasMore && (
                <div ref={sentinelRef} className="feed-loading-state">
                  {loadingMore ? <Loader2 size={18} className="spin" /> : null}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Fanfics' && (
            <div className="perfil-fanfics-col">
              {fanfics.length === 0 ? (
                <p className="perfil-empty-tab">Ainda nao ha fanfics.</p>
              ) : (
                fanfics.map(f => (
                  <div key={f.id} className="perfil-fanfic-card">
                    <div className="perfil-fanfic-genre">Fanfic · {f.fandom} · {f.genre} · {f.chapters} capitulos</div>
                    <div className="perfil-fanfic-title">{f.title}</div>
                    <p className="perfil-fanfic-desc">{f.synopsis || f.summary || 'Sem resumo ainda.'}</p>
                    <div className="perfil-fanfic-meta">
                      <span>{fmt(f.reads_count)} leituras</span>
                      <span>{fmt(f.likes_count)} gostos</span>
                      <span>Atualizado ha {timeAgo(f.updated_at)}</span>
                    </div>
                  </div>
                ))
              )}
              {tabHasMore && (
                <div ref={sentinelRef} className="feed-loading-state">
                  {loadingMore ? <Loader2 size={18} className="spin" /> : null}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Gostos' && (
            <div className="perfil-posts-col">
              {posts.length === 0 ? (
                <p className="perfil-empty-tab">Publicacoes que gostaste aparecem aqui.</p>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <Link href={`/perfil/${post.author.username}`} className="post-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        {post.author.avatar_url
                          ? <img src={post.author.avatar_url} alt={post.author.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : post.author.avatar_initials}
                      </Link>
                      <div className="post-author-info">
                        <Link href={`/perfil/${post.author.username}`} className="post-author-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                          {post.author.display_name}
                          {post.author.role === 'superuser' && <span className="post-badge-su">Super User</span>}
                          {post.author.role === 'mod' && <span className="post-badge-mod">Moderador</span>}
                        </Link>
                        <div className="post-meta">
                          <Link href={`/perfil/${post.author.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>@{post.author.username}</Link>
                          <span>{timeAgo(post.created_at)}</span>
                          {post.category && <span>{post.category}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="post-body">
                      <p className="post-text">{post.content}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="Imagem do post" style={{ maxWidth: '100%', borderRadius: 'var(--radius)', marginTop: 12, maxHeight: 300, objectFit: 'cover' }} />
                      )}
                    </div>
                  </div>
                ))
              )}
              {tabHasMore && (
                <div ref={sentinelRef} className="feed-loading-state">
                  {loadingMore ? <Loader2 size={18} className="spin" /> : null}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right col */}
        <aside className="perfil-right-col">
          <p className="perfil-panel-title">Favoritos de anime</p>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Em breve...</p>

          <p className="perfil-panel-title" style={{ marginTop: 24 }}>Seguidores recentes</p>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>Em breve...</p>
        </aside>
      </div>
    </div>
    <FeatureUnavailableModal
      open={showFeatureModal}
      onClose={() => setShowFeatureModal(false)}
      hint="Esta ação adicional do perfil ainda está em desenvolvimento."
    />
    </>
  )
}