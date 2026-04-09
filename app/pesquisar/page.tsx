'use client'

import { useState } from 'react'
import { Search, TrendingUp, Hash, User, FileText, X } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import PostCard from '@/components/posts/PostCard'
import { mockPosts } from '@/lib/mock-data'
import styles from './page.module.css'

const TABS = ['Tudo', 'Publicacoes', 'Membros', 'Tags', 'Fanfics']

const POPULAR_TAGS = [
  { tag: 'DemonSlayer', count: '4.2k' },
  { tag: 'Frieren', count: '3.8k' },
  { tag: 'JujutsuKaisen', count: '2.9k' },
  { tag: 'OnePiece', count: '2.4k' },
  { tag: 'Cosplay', count: '1.7k' },
  { tag: 'Nendoroid', count: '1.2k' },
  { tag: 'Isekai', count: '987' },
  { tag: 'Shonen', count: '876' },
  { tag: 'SoloLeveling', count: '756' },
  { tag: 'BlueLock', count: '643' },
  { tag: 'Manga', count: '598' },
  { tag: 'AMV', count: '412' },
]

const USERS_RESULT = [
  { name: 'AkiraFan99', handle: '@akirafan99', initials: 'AK', bg: '#0a2015', color: '#5cfcb4', followers: '1.2k', bio: 'Otaku desde sempre. Fan de Shonen e Slice of Life.' },
  { name: 'SakuraHime', handle: '@sakurahime', initials: 'SH', bg: '#1a0010', color: '#fc5c7d', followers: '3.4k', bio: 'Cosplayer profissional. Adoro Demon Slayer e Naruto.' },
  { name: 'YukiSenpai', handle: '@yukisenpai', initials: 'YS', bg: '#1a1000', color: '#fcb45c', followers: '2.1k', bio: 'Moderadora do PORTAL. Especialista em anime seinen.' },
  { name: 'NaruZuki', handle: '@naruzuki', initials: 'NZ', bg: '#0a0a2a', color: '#7c5cfc', followers: '890', bio: 'Leitor de manga. One Piece e HxH para sempre.' },
]

export default function PesquisarPage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('Tudo')
  const [followed, setFollowed] = useState<Set<string>>(new Set())

  const hasQuery = query.trim().length > 0

  const filteredPosts = mockPosts.filter(p =>
    p.text.toLowerCase().includes(query.toLowerCase()) ||
    p.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
  )

  const filteredUsers = USERS_RESULT.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.handle.toLowerCase().includes(query.toLowerCase())
  )

  const filteredTags = POPULAR_TAGS.filter(t =>
    t.tag.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <Topbar title="Pesquisar" />

      <div className={styles.body}>
        <div className={styles.mainCol}>
          {/* Search bar */}
          <div className={styles.searchWrap}>
            <div className={styles.searchBar}>
              <Search size={16} color="var(--text3)" />
              <input
                autoFocus
                type="text"
                placeholder="Pesquisar anime, membros, tags..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button className={styles.clearBtn} onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          {hasQuery && (
            <div className={styles.tabs}>
              {TABS.map(t => (
                <button
                  key={t}
                  className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(t)}
                >{t}</button>
              ))}
            </div>
          )}

          {/* No query — show trending */}
          {!hasQuery && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <TrendingUp size={16} />
                Em destaque agora
              </div>
              <div className={styles.tagGrid}>
                {POPULAR_TAGS.map(t => (
                  <button key={t.tag} className={styles.tagCard} onClick={() => setQuery(t.tag)}>
                    <Hash size={14} />
                    <span className={styles.tagName}>{t.tag}</span>
                    <span className={styles.tagCount}>{t.count} posts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results with query */}
          {hasQuery && (activeTab === 'Tudo' || activeTab === 'Membros') && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}><User size={15} /> Membros</div>
              {filteredUsers.length === 0
                ? <p className={styles.empty}>Nenhum membro encontrado para "{query}"</p>
                : filteredUsers.map(u => (
                  <div key={u.name} className={styles.userResult}>
                    <div className={styles.userAvatar} style={{ background: u.bg, color: u.color }}>{u.initials}</div>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{u.name}</span>
                      <span className={styles.userHandle}>{u.handle} · {u.followers} seguidores</span>
                      <span className={styles.userBio}>{u.bio}</span>
                    </div>
                    <button
                      className={`${styles.followBtn} ${followed.has(u.name) ? styles.followingBtn : ''}`}
                      onClick={() => setFollowed(prev => { const n = new Set(prev); n.has(u.name) ? n.delete(u.name) : n.add(u.name); return n })}
                    >
                      {followed.has(u.name) ? 'A seguir' : 'Seguir'}
                    </button>
                  </div>
                ))
              }
            </div>
          )}

          {hasQuery && (activeTab === 'Tudo' || activeTab === 'Tags') && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}><Hash size={15} /> Tags</div>
              {filteredTags.length === 0
                ? <p className={styles.empty}>Nenhuma tag encontrada para "{query}"</p>
                : (
                  <div className={styles.tagGrid}>
                    {filteredTags.map(t => (
                      <button key={t.tag} className={styles.tagCard} onClick={() => setQuery(t.tag)}>
                        <Hash size={14} /><span className={styles.tagName}>{t.tag}</span>
                        <span className={styles.tagCount}>{t.count} posts</span>
                      </button>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {hasQuery && (activeTab === 'Tudo' || activeTab === 'Publicacoes') && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}><FileText size={15} /> Publicacoes</div>
              {filteredPosts.length === 0
                ? <p className={styles.empty}>Nenhuma publicacao encontrada para "{query}"</p>
                : (
                  <div className={styles.postsList}>
                    {filteredPosts.map(p => <PostCard key={p.id} post={p} />)}
                  </div>
                )
              }
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className={styles.rightPanel}>
          <p className={styles.panelTitle}>Tags populares</p>
          {POPULAR_TAGS.slice(0, 8).map(t => (
            <button key={t.tag} className={styles.tagPill} onClick={() => setQuery(t.tag)}>
              <Hash size={12} />{t.tag}
              <span className={styles.tagPillCount}>{t.count}</span>
            </button>
          ))}
        </aside>
      </div>
    </div>
  )
}
