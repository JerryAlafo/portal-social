'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Flame, Clock, Star, Loader2 } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { getFeed } from '@/services/posts'
import { getSuggestions } from '@/services/suggestions'
import { getEvents } from '@/services/events'
import { followUser } from '@/services/following'
import type { Post, Profile, Event } from '@/types'

const FILTERS = [
  { id: 'trending', label: 'Em Alta', icon: TrendingUp },
  { id: 'hot', label: 'Popular', icon: Flame },
  { id: 'recent', label: 'Recente', icon: Clock },
  { id: 'top', label: 'Top', icon: Star },
]

const CATEGORIES = ['Tudo', 'Shonen', 'Shojo', 'Isekai', 'Seinen', 'Cosplay', 'Manga', 'Figura', 'AMV', 'Fanfic', 'Arte']

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export default function ExplorarPage() {
  const [activeFilter, setActiveFilter] = useState('trending')
  const [activeCategory, setActiveCategory] = useState('Tudo')
  const [posts, setPosts] = useState<Post[]>([])
  const [suggestions, setSuggestions] = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [followed, setFollowed] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [postsRes, suggRes, eventsRes] = await Promise.all([
          getFeed(1, 20, activeCategory),
          getSuggestions(),
          getEvents(),
        ])
        if (postsRes.data) setPosts(postsRes.data)
        if (suggRes.data) setSuggestions(suggRes.data.slice(0, 5))
        if (eventsRes.data) setEvents(eventsRes.data.slice(0, 3))
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    loadData()
  }, [activeCategory])

  const handleFollow = async (userId: string, username: string) => {
    const next = new Set(followed)
    next.has(username) ? next.delete(username) : next.add(username)
    setFollowed(next)
    try { await followUser(userId) } catch { /* ignore */ }
  }

  return (
    <div className="explorar-page">
      <Topbar title="Explorar" />
      <div className="explorar-body">
        <div className="explorar-main-col">

          {/* Featured cards */}
          <div className="explorar-featured">
            {events.slice(0, 3).map(ev => {
              const d = new Date(ev.date)
              const label = d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' }).toUpperCase()
              return (
                <div key={ev.id} className="explorar-featured-card">
                  <div className="explorar-featured-sub" style={{ color: ev.date_color || 'var(--accent2)' }}>
                    {ev.location || 'Evento'}
                  </div>
                  <div className="explorar-featured-title">{ev.title}</div>
                  <div className="explorar-featured-count">{fmt(ev.interested_count)} interessados</div>
                </div>
              )
            })}
            {events.length === 0 && (
              <>
                <div className="explorar-featured-card">
                  <div className="explorar-featured-sub" style={{ color: 'var(--accent2)' }}>Anime</div>
                  <div className="explorar-featured-title">Frieren</div>
                  <div className="explorar-featured-count">3.8k discussoes</div>
                </div>
                <div className="explorar-featured-card">
                  <div className="explorar-featured-sub" style={{ color: 'var(--pink)' }}>Evento</div>
                  <div className="explorar-featured-title">Lisboa Anime Fest</div>
                  <div className="explorar-featured-count">342 interessados</div>
                </div>
                <div className="explorar-featured-card">
                  <div className="explorar-featured-sub" style={{ color: 'var(--amber)' }}>Anime</div>
                  <div className="explorar-featured-title">Demon Slayer</div>
                  <div className="explorar-featured-count">4.2k discussoes</div>
                </div>
              </>
            )}
          </div>

          {/* Filter + category */}
          <div className="explorar-filters">
            {FILTERS.map(f => (
              <button
                key={f.id}
                className={`explorar-filter-btn ${activeFilter === f.id ? 'explorar-filter-active' : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                <f.icon size={14} />
                {f.label}
              </button>
            ))}
          </div>

          <div className="explorar-chips">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`explorar-chip ${activeCategory === c ? 'explorar-chip-active' : ''}`}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Posts */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={24} className="spin" />
            </div>
          ) : (
            <div className="explorar-posts">
              {posts.length === 0 ? (
                <p style={{ color: 'var(--text3)', fontSize: 14 }}>Nenhuma publicacao encontrada.</p>
              ) : posts.map(p => (
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
          )}
        </div>

        {/* Right */}
        <aside className="explorar-right-panel">
          <p className="explorar-panel-title">Membros em destaque</p>
          {suggestions.length > 0
            ? suggestions.map(u => (
                <div key={u.id} className="explorar-featured-user">
                  <div className="explorar-featured-user-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                    {u.avatar_initials || u.display_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="explorar-featured-user-info">
                    <span className="explorar-featured-user-name">{u.display_name}</span>
                    <span className="explorar-featured-user-meta">@{u.username} · {fmt(u.followers_count || 0)}</span>
                  </div>
                  <button
                    className={`explorar-follow-btn ${followed.has(u.username) ? 'explorar-following-btn' : ''}`}
                    onClick={() => handleFollow(u.id, u.username)}
                  >
                    {followed.has(u.username) ? 'A seguir' : 'Seguir'}
                  </button>
                </div>
              ))
            : (
              <>
                {['PortalAdmin', 'YukiSenpai', 'SakuraHime'].map((name, i) => (
                  <div key={name} className="explorar-featured-user">
                    <div className="explorar-featured-user-avatar" style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="explorar-featured-user-info">
                      <span className="explorar-featured-user-name">{name}</span>
                      <span className="explorar-featured-user-meta">@{(name.charAt(0).toLowerCase() + name.slice(1))}</span>
                    </div>
                    <button className="explorar-follow-btn">Seguir</button>
                  </div>
                ))}
              </>
            )
          }
        </aside>
      </div>
    </div>
  )
}