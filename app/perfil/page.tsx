'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MapPin, Link2, Calendar, MoreHorizontal, Share2, Edit3, Loader2 } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'

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
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('Publicacoes')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [fanfics, setFanfics] = useState<Fanfic[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])

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

  useEffect(() => {
    async function loadTabData() {
      if (!userId || !profile) return
      try {
        if (activeTab === 'Publicacoes') {
          const res = await fetch(`/api/users/${userId}/profile?tab=posts&limit=20`)
          const json = await res.json()
          setPosts(json.data || [])
        } else if (activeTab === 'Fanfics') {
          const res = await fetch(`/api/users/${userId}/profile?tab=fanfics&limit=20`)
          const json = await res.json()
          setFanfics(json.data || [])
        } else if (activeTab === 'Galeria') {
          const res = await fetch(`/api/users/${userId}/profile?tab=gallery&limit=20`)
          const json = await res.json()
          setGallery(json.data || [])
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadTabData()
  }, [activeTab, userId, profile])

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
    <div className="perfil-page">
      <Topbar title="Perfil" />

      <div className="perfil-body">
        <div className="perfil-main-col">

          {/* Banner */}
          <div className="perfil-banner">
            <div className="perfil-banner-overlay" />
            <button className="perfil-banner-edit-btn">
              <Edit3 size={12} /> Editar banner
            </button>
          </div>

          {/* Info area */}
          <div className="perfil-info-area">
            <div className="perfil-avatar-row">
              <div className="perfil-avatar-wrap">
                <div className="perfil-avatar">{initials}</div>
                <button className="perfil-avatar-edit-btn"><Edit3 size={12} /></button>
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
                <button className="perfil-edit-btn">Editar Perfil</button>
                <button className="perfil-icon-btn"><Share2 size={14} /></button>
                <button className="perfil-icon-btn"><MoreHorizontal size={14} /></button>
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
                      <div className="post-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                        {post.author.avatar_url
                          ? <img src={post.author.avatar_url} alt={post.author.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : post.author.avatar_initials}
                      </div>
                      <div className="post-author-info">
                        <div className="post-author-name">
                          {post.author.display_name}
                          {post.author.role === 'superuser' && <span className="post-badge-su">Super User</span>}
                          {post.author.role === 'mod' && <span className="post-badge-mod">Moderador</span>}
                        </div>
                        <div className="post-meta">
                          <span>@{post.author.username}</span>
                          <span>{timeAgo(post.created_at)}</span>
                          {post.category && <span>{post.category}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="post-body">
                      <p className="post-text">{post.content}</p>
                    </div>
                  </div>
                ))
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
                    <p className="perfil-fanfic-desc">{f.synopsis}</p>
                    <div className="perfil-fanfic-meta">
                      <span>{fmt(f.reads_count)} leituras</span>
                      <span>{fmt(f.likes_count)} gostos</span>
                      <span>Atualizado ha {timeAgo(f.updated_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'Gostos' && (
            <div className="perfil-empty-tab">
              Publicacoes que gostaste aparecem aqui.
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
  )
}