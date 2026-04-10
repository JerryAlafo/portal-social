'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { getFollowing, unfollowUser } from '@/services/following'
import { getFeed } from '@/services/posts'
import type { Profile, Post } from '@/types'

export default function SeguindoPage() {
  const { data: session } = useSession()
  const [following, setFollowing] = useState<Profile[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!session?.user?.id) return
      setLoading(true)
      try {
        const [followingRes, feedRes] = await Promise.all([
          getFollowing(),
          getFeed(1, 20, 'Following'),
        ])
        if (followingRes.data) setFollowing(followingRes.data)
        if (feedRes.data) setPosts(feedRes.data)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    loadData()
  }, [session?.user?.id])

  const handleUnfollow = async (userId: string, username: string) => {
    try {
      await unfollowUser(userId)
      setFollowing(prev => prev.filter(f => f.id !== userId))
    } catch { /* ignore */ }
  }

  const onlineFollowing = following.filter(f => f.is_online)
  const othersFollowing = following.filter(f => !f.is_online)

  return (
    <div className="seguindo-page">
      <Topbar title="A Seguir" />
      <div className="seguindo-body">
        <div className="seguindo-feed-col">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={24} className="spin" />
            </div>
          ) : (
            <>
              {onlineFollowing.length > 0 && (
                <div className="seguindo-online-bar">
                  <span className="seguindo-online-label">Online agora</span>
                  <div className="seguindo-online-list">
                    {onlineFollowing.map(f => (
                      <div key={f.id} className="seguindo-online-bubble">
                        <div className="seguindo-online-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                          {f.avatar_initials || f.display_name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="seguindo-online-dot" />
                        <span className="seguindo-online-name">{f.display_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="seguindo-feed-label">Publicacoes recentes de quem segues</p>

              <div className="seguindo-posts">
                {posts.length === 0 ? (
                  <p style={{ color: 'var(--text3)', fontSize: 14 }}>Ainda nao ha publicacoes de quem segues.</p>
                ) : posts.map((p, i) => (
                  <div key={p.id} className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 4)}`}>
                    <div className="post-card">
                      <div className="post-header">
                        <div className="post-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                          {p.author.avatar_url
                            ? <img src={p.author.avatar_url} alt={p.author.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            : p.author.avatar_initials}
                        </div>
                        <div className="post-author-info">
                          <div className="post-author-name">
                            {p.author.display_name}
                            {p.author.role === 'superuser' && <span className="post-badge-su">Super User</span>}
                            {p.author.role === 'mod' && <span className="post-badge-mod">Moderador</span>}
                          </div>
                          <div className="post-meta">
                            <span>@{p.author.username}</span>
                            {p.category && <span>{p.category}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="post-body">
                        <p className="post-text">{p.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="seguindo-right-panel">
          <p className="seguindo-panel-title">A seguir ({following.length})</p>
          {following.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Ainda nao segues ninguem.</p>
          ) : (
            [...onlineFollowing, ...othersFollowing].map(f => (
              <div key={f.id} className="seguindo-follow-item">
                <div className="seguindo-follow-avatar-wrap">
                  <div className="seguindo-follow-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                    {f.avatar_initials || f.display_name?.slice(0, 2).toUpperCase()}
                  </div>
                  {f.is_online && <span className="seguindo-online-dot-small" />}
                </div>
                <span className="seguindo-follow-name">{f.display_name}</span>
                <button
                  className="seguindo-unfollow-btn"
                  onClick={() => handleUnfollow(f.id, f.username)}
                >
                  Deixar de seguir
                </button>
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  )
}