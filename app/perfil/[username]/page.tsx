'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MapPin, Link2, Calendar, MoreHorizontal, Share2, Edit3, Loader2, UserPlus, UserCheck, MessageCircle, X, User, Check } from 'lucide-react'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

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
  is_following?: boolean
}

interface SimpleUser {
  id: string
  username: string
  display_name: string
  avatar_initials: string
  avatar_url: string | null
  is_following?: boolean
}

interface UserListModalProps {
  type: 'followers' | 'following'
  users: SimpleUser[]
  loading: boolean
  onClose: () => void
}

function UserListModal({ type, users, loading, onClose }: UserListModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{type === 'followers' ? 'Seguidores' : 'A seguir'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="modal-loading"><Loader2 size={20} className="spin" /></div>
          ) : users.length === 0 ? (
            <p className="modal-empty">Ninguém aqui ainda.</p>
          ) : (
            users.map(user => (
              <Link key={user.id} href={`/perfil/${user.username}`} className="user-list-item" onClick={onClose}>
                <div className="user-list-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt={user.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : user.avatar_initials}
                </div>
                <div className="user-list-info">
                  <span className="user-list-name">{user.display_name}</span>
                  <span className="user-list-handle">@{user.username}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
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

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('Publicacoes')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [fanfics, setFanfics] = useState<Fanfic[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [following, setFollowing] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followersList, setFollowersList] = useState<SimpleUser[]>([])
  const [followingList, setFollowingList] = useState<SimpleUser[]>([])
  const [loadingFollowers, setLoadingFollowers] = useState(false)
  const [loadingFollowing, setLoadingFollowing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tabPage, setTabPage] = useState(1)
  const [tabHasMore, setTabHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const isOwnProfile = session?.user?.username === username

  // Load profile + verify following status (like likes pattern)
  useEffect(() => {
    if (!username || !session?.user?.id) return

    async function loadProfile() {
      setLoading(true)
      try {
        const res = await fetch(`/api/users/username/${username}/profile`)
        const json = await res.json()
        if (json.profile) {
          setProfile(json.profile)
          setPosts(json.data || [])

          // Immediately verify following status via API (like likes)
          if (!isOwnProfile) {
            try {
              const checkRes = await fetch(`/api/following?check=${json.profile.id}`)
              const checkJson = await checkRes.json()
              setFollowing(checkJson.data?.following ?? false)
            } catch {
              setFollowing(json.profile.is_following || false)
            }
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [username, session?.user?.id])

  const loadTabData = useCallback(async (page: number, append: boolean) => {
    if (!profile?.id || !username) return

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

      const res = await fetch(`/api/users/${profile.id}/profile?tab=${tab}&page=${page}&limit=20`)
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
  }, [activeTab, profile?.id, username])

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

  const handleFollow = async () => {
    if (!profile) return

    const wasFollowing = following

    // Optimistic update
    setFollowing(!wasFollowing)
    setProfile(prev => prev ? {
      ...prev,
      followers_count: wasFollowing
        ? prev.followers_count - 1
        : prev.followers_count + 1
    } : null)

    try {
      const res = await fetch('/api/following', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile.id })
      })
      const json = await res.json()

      if (json.data?.following !== undefined) {
        setFollowing(json.data.following)
        // Adjust followers count if API returns different state
        if (json.data.following !== !wasFollowing) {
          setProfile(prev => prev ? {
            ...prev,
            followers_count: json.data.following
              ? prev.followers_count + 1
              : prev.followers_count - 1
          } : null)
        }
      }
    } catch (e) {
      // Revert on error
      setFollowing(wasFollowing)
      setProfile(prev => prev ? {
        ...prev,
        followers_count: wasFollowing
          ? prev.followers_count + 1
          : prev.followers_count - 1
      } : null)
      console.error(e)
    }
  }

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/perfil/${username}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.display_name} no PORTAL`,
          text: profile?.bio || `Veja o perfil de ${profile?.display_name}`,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch { /* ignore */ }
  }

  const loadFollowers = async () => {
    if (!profile) return
    setLoadingFollowers(true)
    try {
      const res = await fetch(`/api/users/${profile.id}/followers`)
      const json = await res.json()
      setFollowersList(json.data || [])
    } catch { setFollowersList([]) }
    finally { setLoadingFollowers(false) }
  }

  const loadFollowing = async () => {
    if (!profile) return
    setLoadingFollowing(true)
    try {
      const res = await fetch(`/api/users/${profile.id}/following`)
      const json = await res.json()
      setFollowingList(json.data || [])
    } catch { setFollowingList([]) }
    finally { setLoadingFollowing(false) }
  }

  const openFollowersModal = () => {
    loadFollowers()
    setShowFollowersModal(true)
  }

  const openFollowingModal = () => {
    loadFollowing()
    setShowFollowingModal(true)
  }

  if (loading) {
    return (
      <div className="perfil-page">
        <Topbar title={username || 'Perfil'} />
        <div className="perfil-body" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Loader2 size={32} className="spin" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="perfil-page">
        <Topbar title="Perfil" />
        <div className="perfil-body">
          <p style={{ color: 'var(--text3)', textAlign: 'center', padding: 40 }}>
            Utilizador não encontrado.
          </p>
        </div>
      </div>
    )
  }

  const initials = profile.avatar_initials || profile.display_name?.slice(0, 2).toUpperCase() || '??'
  const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) : ''

  return (
    <div className="perfil-page">
      <Topbar title={profile.display_name} />

      <div className="perfil-body">
        <div className="perfil-main-col">

          <div className="perfil-banner">
            <div className="perfil-banner-overlay" />
            {isOwnProfile && (
              <button className="perfil-banner-edit-btn">
                <Edit3 size={12} /> Editar banner
              </button>
            )}
          </div>

          <div className="perfil-info-area">
            <div className="perfil-avatar-row">
              <div className="perfil-avatar-wrap">
                <div className="perfil-avatar">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : initials}
                </div>
                {isOwnProfile && <button className="perfil-avatar-edit-btn"><Edit3 size={12} /></button>}
              </div>
              <div className="perfil-name-meta">
                <div className="perfil-name">
                  {profile.display_name}
                  {getRoleBadge(profile.role)}
                </div>
                <div className="perfil-handle">@{profile.username} · Membro desde {joinDate}</div>
                <div className="perfil-badges">
                  {profile.role === 'superuser' && <span className="perfil-badge-su">Super User</span>}
                  {profile.level && <span className="perfil-badge-level">Nivel {profile.level}</span>}
                </div>
              </div>
              {!isOwnProfile && session && (
                <div className="perfil-profile-actions">
                  <button 
                    className={`perfil-follow-btn ${following ? 'perfil-following' : ''}`}
                    onClick={handleFollow}
                  >
                    {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                    {following ? 'Seguindo' : 'Seguir'}
                  </button>
                  <Link href={`/mensagens?user=${profile.id}`} className="perfil-msg-btn">
                    <MessageCircle size={14} />
                  </Link>
                  <button className="perfil-icon-btn" onClick={handleShareProfile}>
                    {copied ? <Check size={14} /> : <Share2 size={14} />}
                  </button>
                  <button className="perfil-icon-btn"><MoreHorizontal size={14} /></button>
                </div>
              )}
              {isOwnProfile && (
                <div className="perfil-profile-actions">
                  <button className="perfil-edit-btn">Editar Perfil</button>
                  <button className="perfil-icon-btn" onClick={handleShareProfile}>
                    {copied ? <Check size={14} /> : <Share2 size={14} />}
                  </button>
                  <button className="perfil-icon-btn"><MoreHorizontal size={14} /></button>
                </div>
              )}
            </div>

            <p className="perfil-bio">
              {profile.bio || 'Sem bio ainda.'}
            </p>

            <div className="perfil-details">
              {profile.location && (
                <span className="perfil-detail"><MapPin size={13} /> {profile.location}</span>
              )}
              {profile.website && (
                <span className="perfil-detail"><Link2 size={13} /> {profile.website}</span>
              )}
              <span className="perfil-detail"><Calendar size={13} /> Juntou-se em {joinDate}</span>
            </div>

            <div className="perfil-stats">
              <div className="perfil-stat">
                <span className="perfil-stat-num">{fmt(profile.posts_count)}</span>
                <span className="perfil-stat-label">Publicacoes</span>
              </div>
              <button className="perfil-stat perfil-stat-clickable" onClick={openFollowersModal}>
                <span className="perfil-stat-num">{fmt(profile.followers_count)}</span>
                <span className="perfil-stat-label">Seguidores</span>
              </button>
              <button className="perfil-stat perfil-stat-clickable" onClick={openFollowingModal}>
                <span className="perfil-stat-num">{fmt(profile.following_count)}</span>
                <span className="perfil-stat-label">A seguir</span>
              </button>
              <div className="perfil-stat">
                <span className="perfil-stat-num">{fmt(profile.likes_received_count)}</span>
                <span className="perfil-stat-label">Gostos recebidos</span>
              </div>
            </div>
          </div>

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
                    <div className="perfil-fanfic-genre">Fanfic · {f.fandom} · {f.genre}</div>
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
      </div>

      {showFollowersModal && (
        <UserListModal
          type="followers"
          users={followersList}
          loading={loadingFollowers}
          onClose={() => setShowFollowersModal(false)}
        />
      )}

      {showFollowingModal && (
        <UserListModal
          type="following"
          users={followingList}
          loading={loadingFollowing}
          onClose={() => setShowFollowingModal(false)}
        />
      )}
    </div>
  )
}
