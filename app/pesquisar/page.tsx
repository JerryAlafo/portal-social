'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, Hash, User, FileText, X, Loader2 } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { search } from '@/services/search'
import { getTrending } from '@/services/trending'
import { followUser } from '@/services/following'
import type { Profile, Post, TrendingTag } from '@/types'

const TABS = ['Tudo', 'Publicacoes', 'Membros', 'Tags', 'Fanfics']

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export default function PesquisarPage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('Tudo')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ users: Profile[]; posts: Post[]; tags: TrendingTag[] }>({ users: [], posts: [], tags: [] })
  const [trending, setTrending] = useState<TrendingTag[]>([])
  const [followed, setFollowed] = useState<Set<string>>(new Set())

  useEffect(() => {
    getTrending().then(r => { if (r.data) setTrending(r.data) }).catch(() => {})
  }, [])

  useEffect(() => {
    async function doSearch() {
      if (!query.trim()) {
        setResults({ users: [], posts: [], tags: [] })
        return
      }
      setLoading(true)
      try {
        const res = await search(query.trim())
        if (res.data) setResults(res.data)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    const timeout = setTimeout(doSearch, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const hasQuery = query.trim().length > 0

  const handleFollow = async (userId: string, username: string) => {
    const next = new Set(followed)
    next.has(username) ? next.delete(username) : next.add(username)
    setFollowed(next)
    try { await followUser(userId) } catch { /* revert on failure */ }
  }

  return (
    <div className="pesquisar-page">
      <Topbar title="Pesquisar" />

      <div className="pesquisar-body">
        <div className="pesquisar-main-col">
          {/* Search bar */}
          <div className="pesquisar-search-wrap">
            <div className="pesquisar-search-bar">
              <Search size={16} color="var(--text3)" />
              <input
                autoFocus
                type="text"
                placeholder="Pesquisar anime, membros, tags..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button className="pesquisar-clear-btn" onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          {hasQuery && (
            <div className="pesquisar-tabs">
              {TABS.map(t => (
                <button
                  key={t}
                  className={`pesquisar-tab ${activeTab === t ? 'pesquisar-tab-active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >{t}</button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={24} className="spin" />
            </div>
          )}

          {/* No query — show trending */}
          {!hasQuery && !loading && (
            <div className="pesquisar-section">
              <div className="pesquisar-section-title">
                <TrendingUp size={16} />
                Em destaque agora
              </div>
              <div className="pesquisar-tag-grid">
                {trending.map(t => (
                  <button key={t.id} className="pesquisar-tag-card" onClick={() => setQuery(t.tag)}>
                    <Hash size={14} />
                    <span className="pesquisar-tag-name">{t.tag}</span>
                    <span className="pesquisar-tag-count">{t.post_count.toLocaleString('pt')} posts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results with query */}
          {hasQuery && !loading && (activeTab === 'Tudo' || activeTab === 'Membros') && (
            <div className="pesquisar-section">
              <div className="pesquisar-section-title"><User size={15} /> Membros</div>
              {results.users.length === 0
                ? <p className="pesquisar-empty">Nenhum membro encontrado para &quot;{query}&quot;</p>
                : results.users.map(u => (
                  <div key={u.id} className="pesquisar-user-result">
                    <div className="pesquisar-user-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                      {u.avatar_initials || u.display_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="pesquisar-user-info">
                      <span className="pesquisar-user-name">{u.display_name}</span>
                      <span className="pesquisar-user-handle">@{u.username} · {fmt(u.followers_count || 0)} seguidores</span>
                      {u.bio && <span className="pesquisar-user-bio">{u.bio}</span>}
                    </div>
                    <button
                      className={`pesquisar-follow-btn ${followed.has(u.username) ? 'pesquisar-following-btn' : ''}`}
                      onClick={() => handleFollow(u.id, u.username)}
                    >
                      {followed.has(u.username) ? 'A seguir' : 'Seguir'}
                    </button>
                  </div>
                ))
              }
            </div>
          )}

          {hasQuery && !loading && (activeTab === 'Tudo' || activeTab === 'Tags') && (
            <div className="pesquisar-section">
              <div className="pesquisar-section-title"><Hash size={15} /> Tags</div>
              {results.tags.length === 0
                ? <p className="pesquisar-empty">Nenhuma tag encontrada para &quot;{query}&quot;</p>
                : (
                  <div className="pesquisar-tag-grid">
                    {results.tags.map(t => (
                      <button key={t.id} className="pesquisar-tag-card" onClick={() => setQuery(t.tag)}>
                        <Hash size={14} /><span className="pesquisar-tag-name">{t.tag}</span>
                        <span className="pesquisar-tag-count">{t.post_count.toLocaleString('pt')} posts</span>
                      </button>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {hasQuery && !loading && (activeTab === 'Tudo' || activeTab === 'Publicacoes') && (
            <div className="pesquisar-section">
              <div className="pesquisar-section-title"><FileText size={15} /> Publicacoes</div>
              {results.posts.length === 0
                ? <p className="pesquisar-empty">Nenhuma publicacao encontrada para &quot;{query}&quot;</p>
                : (
                  <div className="pesquisar-posts-list">
                    {results.posts.map(p => (
                      <div key={p.id} className="post-card">
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
                    ))}
                  </div>
                )
              }
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className="pesquisar-right-panel">
          <p className="pesquisar-panel-title">Tags populares</p>
          {trending.slice(0, 8).map(t => (
            <button key={t.id} className="pesquisar-tag-pill" onClick={() => setQuery(t.tag)}>
              <Hash size={12} />{t.tag}
              <span className="pesquisar-tag-pill-count">{t.post_count.toLocaleString('pt')}</span>
            </button>
          ))}
        </aside>
      </div>
    </div>
  )
}