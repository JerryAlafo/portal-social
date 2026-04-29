'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { getFollowing, unfollowUser } from '@/services/following'
import { getFeed } from '@/services/posts'
import type { Profile, Post } from '@/types'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

export default function SeguindoPage() {
  const { data: session } = useSession()
  const [following, setFollowing] = useState<Profile[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadPostsPage = useCallback(async (targetPage: number, append: boolean) => {
    const feedRes = await getFeed(targetPage, 20, undefined, 'following')
    const nextPosts = feedRes.data ?? []
    setHasMore(nextPosts.length === 20)
    setPage(targetPage)
    setPosts((prev) => (append ? [...prev, ...nextPosts] : nextPosts))
  }, [])

  useEffect(() => {
    async function loadData() {
      if (!session?.user?.id) return
      setLoading(true)
      try {
        const [followingRes] = await Promise.all([
          getFollowing(),
        ])
        if (followingRes.data) setFollowing(followingRes.data)
        await loadPostsPage(1, false)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    loadData()
  }, [loadPostsPage, session?.user?.id])

  const handleLoadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      await loadPostsPage(page + 1, true)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadPostsPage, loading, loadingMore, page])

  const sentinelRef = useInfiniteScroll({
    enabled: true,
    hasMore,
    isLoading: loading || loadingMore,
    onLoadMore: handleLoadMore,
  })

  const handleUnfollow = async (userId: string) => {
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
                          {f.avatar_url
                            ? <img src={f.avatar_url} alt={f.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            : f.avatar_initials || f.display_name?.slice(0, 2).toUpperCase()}
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
                ) : posts.filter(p => p.author !== null).map((p, i) => (
                  <div key={p.id} className={`animate-fade-in-up animate-delay-${Math.min(i + 1, 4)}`}>
                    <div className="post-card">
                      <div className="post-header">
                        <Link href={`/perfil/${p.author!.username}`} className="post-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                          {p.author!.avatar_url
                            ? <img src={p.author!.avatar_url} alt={p.author!.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            : p.author!.avatar_initials}
                        </Link>
                        <div className="post-author-info">
                          <Link href={`/perfil/${p.author!.username}`} className="post-author-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                            {p.author!.display_name}
                            {p.author!.role === 'superuser' && <span className="post-badge-su">Super User</span>}
                            {p.author!.role === 'mod' && <span className="post-badge-mod">Moderador</span>}
                          </Link>
                          <div className="post-meta">
                            <Link href={`/perfil/${p.author!.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>@{p.author!.username}</Link>
                            {p.category && <span>{p.category}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="post-body">
                        <p className="post-text">{p.content}</p>
                        {p.image_url && (
                          <img src={p.image_url} alt="Imagem do post" className="post-image" style={{ maxWidth: '100%', borderRadius: 'var(--radius)', marginTop: 12, maxHeight: 300, objectFit: 'cover' }} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                    {loadingMore ? <Loader2 size={20} className="spin" /> : null}
                  </div>
                )}
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
                    {f.avatar_url
                      ? <img src={f.avatar_url} alt={f.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : f.avatar_initials || f.display_name?.slice(0, 2).toUpperCase()}
                  </div>
                  {f.is_online && <span className="seguindo-online-dot-small" />}
                </div>
                <span className="seguindo-follow-name">{f.display_name}</span>
                <button
                  className="seguindo-unfollow-btn"
                  onClick={() => handleUnfollow(f.id)}
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