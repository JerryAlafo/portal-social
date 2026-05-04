'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, TrendingUp, Hash, User, FileText, X, Loader2, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { search } from '@/services/search'
import { getTrending } from '@/services/trending'
import { toggleFollow } from '@/services/following'
import { useGuestMode } from '@/components/layout/GuestModeProvider'
import type { Profile, Post, TrendingTag } from '@/types'

const TABS = ['Tudo', 'Publicacoes', 'Membros', 'Tags', 'Fanfics']

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function PesquisarContent() {
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(urlQuery)
  const [activeTab, setActiveTab] = useState('Tudo')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ users: Profile[]; posts: Post[]; tags: TrendingTag[] }>({ users: [], posts: [], tags: [] })
  const [trending, setTrending] = useState<TrendingTag[]>([])
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const { isGuest, requestLogin } = useGuestMode()

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
    if (isGuest) {
      requestLogin({
        title: 'Seguir requer login',
        message: 'Entra na tua conta para seguir membros.',
      })
      return
    }

    const next = new Set(followed)
    next.has(username) ? next.delete(username) : next.add(username)
    setFollowed(next)
    try { await toggleFollow(userId) } catch (e) { /* revert on failure */ }
  }

  return (
    <div className="pesquisar-page">
      <Topbar title="Pesquisar" />

      <div className="pesquisar-body">
        <div className="pesquisar-main-col">
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

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={24} className="spin" />
            </div>
          )}

          {!hasQuery && !loading && trending.length > 0 && (
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

          {hasQuery && !loading && (activeTab === 'Tudo' || activeTab === 'Membros') && (
            <div className="pesquisar-section">
              <div className="pesquisar-section-title"><User size={15} /> Membros</div>
              {results.users.length === 0
                ? <p className="pesquisar-empty">Nenhum membro encontrado para &quot;{query}&quot;</p>
                : results.users.map(u => (
                  <div key={u.id} className="pesquisar-user-result">
                    <Link href={`/perfil/${u.username}`} className="pesquisar-user-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={u.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        : u.avatar_initials || u.display_name?.slice(0, 2).toUpperCase()}
                    </Link>
                    <div className="pesquisar-user-info">
                      <Link href={`/perfil/${u.username}`} className="pesquisar-user-name">{u.display_name}</Link>
                      <span className="pesquisar-user-handle">@{u.username} · {fmt(u.followers_count || 0)} seguidores</span>
                      {u.bio && <span className="pesquisar-user-bio">{u.bio}</span>}
                    </div>
                    <div className="pesquisar-user-actions">
                      <Link
                        href={`/mensagens?user=${u.id}`}
                        className="pesquisar-msg-btn"
                        onClick={(event) => {
                          if (isGuest) {
                            event.preventDefault()
                            requestLogin({
                              title: 'Mensagens protegidas',
                              message: 'Entra na tua conta para enviar mensagens.',
                              returnTo: `/mensagens?user=${u.id}`,
                            })
                          }
                        }}
                      >
                        <MessageCircle size={14} />
                      </Link>
                      <button
                        className={`pesquisar-follow-btn ${followed.has(u.username) ? 'pesquisar-following-btn' : ''}`}
                        onClick={() => handleFollow(u.id, u.username)}
                      >
                        {followed.has(u.username) ? 'A seguir' : 'Seguir'}
                      </button>
                    </div>
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
                    {results.posts.filter(p => p.author !== null).map(p => (
                      <div key={p.id} className="post-card">
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
                    ))}
                  </div>
                )
              }
            </div>
          )}
        </div>

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

export default function PesquisarPage() {
  return (
    <Suspense fallback={
      <div className="pesquisar-page">
        <Topbar title="Pesquisar" />
        <div className="pesquisar-body">
          <div className="pesquisar-main-col">
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={24} className="spin" />
            </div>
          </div>
        </div>
      </div>
    }>
      <PesquisarContent />
    </Suspense>
  )
}
