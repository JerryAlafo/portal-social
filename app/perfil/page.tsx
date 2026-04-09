'use client'

import { useState } from 'react'
import { MapPin, Link2, Calendar, MoreHorizontal, Share2, Edit3 } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import PostCard from '@/components/posts/PostCard'
import { mockPosts } from '@/lib/mock-data'
import styles from './page.module.css'

const TABS = ['Publicacoes', 'Galeria', 'Gostos', 'Fanfics']

const FANFICS = [
  { genre: 'Isekai', chapters: '24 capitulos', title: 'O Caminho do Summoner Solitario', desc: 'Depois de ser summonado para outro mundo sem qualquer habilidade especial, Kenji descobre que o seu poder e chamar aliados do seu mundo original — mas com um custo emocional inesperado...', reads: '48k leituras', likes: '1.2k gostos', updated: 'Atualizado ha 3 dias', color: 'var(--accent2)' },
  { genre: 'Shojo · Completo', chapters: '8 capitulos', title: 'Cartas Para Nenhum Lugar', desc: 'Uma historia sobre duas otakus que se conhecem num forum de manga e comecam a trocar cartas fisicas — numa era em que ninguem o faz...', reads: '12k leituras', likes: '640 gostos', updated: 'Completo', color: 'var(--pink)' },
]

export default function PerfilPage() {
  const [activeTab, setActiveTab] = useState('Publicacoes')
  const myPosts = mockPosts.filter(p => p.authorHandle === '@jalafo' || p.id === '2' || p.id === '5')

  return (
    <div className={styles.page}>
      <Topbar title="Perfil" />

      <div className={styles.body}>
        <div className={styles.mainCol}>

          {/* Banner */}
          <div className={styles.banner}>
            <div className={styles.bannerOverlay} />
            <button className={styles.bannerEditBtn}>
              <Edit3 size={12} /> Editar banner
            </button>
          </div>

          {/* Info area */}
          <div className={styles.infoArea}>
            <div className={styles.avatarRow}>
              <div className={styles.avatarWrap}>
                <div className={styles.avatar}>JA</div>
                <button className={styles.avatarEditBtn}><Edit3 size={12} /></button>
              </div>
              <div className={styles.nameMeta}>
                <div className={styles.name}>
                  Jerry Otaku
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className={styles.handle}>@jalafo · Membro desde Fevereiro 2025</div>
                <div className={styles.badges}>
                  <span className={styles.badgeSU}>Super User</span>
                  <span className={styles.badgeLevel}>Nivel 24 · Otaku Mestre</span>
                  <span className={styles.badgeVerified}>Verificado</span>
                </div>
              </div>
              <div className={styles.profileActions}>
                <button className={styles.editBtn}>Editar Perfil</button>
                <button className={styles.iconBtn}><Share2 size={14} /></button>
                <button className={styles.iconBtn}><MoreHorizontal size={14} /></button>
              </div>
            </div>

            <p className={styles.bio}>
              Otaku de coracao. Apaixonado por anime desde os 8 anos. Fanatico por Shonen e Isekai. Coleccionador de figuras Nendoroid e escritor de fanfics nas horas vagas. Vivo no PORTAL.
            </p>

            <div className={styles.details}>
              <span className={styles.detail}><MapPin size={13} /> Lisboa, Portugal</span>
              <span className={styles.detail}><Link2 size={13} /> myanimelist.net/jalafo</span>
              <span className={styles.detail}><Calendar size={13} /> Juntou-se em Fev 2025</span>
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}><span className={styles.statNum}>1.2k</span><span className={styles.statLabel}>Publicacoes</span></div>
              <div className={styles.stat}><span className={styles.statNum}>8.4k</span><span className={styles.statLabel}>Seguidores</span></div>
              <div className={styles.stat}><span className={styles.statNum}>412</span><span className={styles.statLabel}>A seguir</span></div>
              <div className={styles.stat}><span className={styles.statNum}>94k</span><span className={styles.statLabel}>Gostos recebidos</span></div>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t}
                className={`${styles.tab} ${activeTab === t ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'Publicacoes' && (
            <div className={styles.postsCol}>
              {myPosts.map(post => (
                <PostCard key={post.id} post={{ ...post, authorName: 'Jerry Otaku', authorHandle: '@jalafo', authorInitials: 'JA', authorBg: '#12092a', authorColor: '#9b7fff' }} />
              ))}
            </div>
          )}

          {activeTab === 'Galeria' && (
            <div className={styles.galleryGrid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={styles.galleryCell}>
                  <div className={styles.galleryOverlay}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Fanfics' && (
            <div className={styles.fanficsCol}>
              {FANFICS.map(f => (
                <div key={f.title} className={styles.fanficCard}>
                  <div className={styles.fanficGenre} style={{ color: f.color }}>Fanfic · {f.genre} · {f.chapters}</div>
                  <div className={styles.fanficTitle}>{f.title}</div>
                  <p className={styles.fanficDesc}>{f.desc}</p>
                  <div className={styles.fanficMeta}>
                    <span>{f.reads}</span>
                    <span>{f.likes}</span>
                    <span>{f.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Gostos' && (
            <div className={styles.emptyTab}>
              Publicacoes que @jalafo gostou aparecem aqui.
            </div>
          )}
        </div>

        {/* Right col */}
        <aside className={styles.rightCol}>
          <p className={styles.panelTitle}>Favoritos de anime</p>
          {[
            { title: "Frieren: Beyond Journey's End", sub: 'Slice of life · Fantasy · 2023' },
            { title: 'Fullmetal Alchemist: Brotherhood', sub: 'Action · Shonen · 2009' },
            { title: 'Steins;Gate', sub: 'Sci-fi · Thriller · 2011' },
          ].map(a => (
            <div key={a.title} className={styles.animeItem}>
              <div className={styles.animePoster} />
              <div>
                <div className={styles.animeTitle}>{a.title}</div>
                <div className={styles.animeSub}>{a.sub}</div>
              </div>
            </div>
          ))}

          <p className={styles.panelTitle} style={{ marginTop: 24 }}>Seguidores recentes</p>
          {[
            { name: 'OtakuRei', bg: '#1a0030', color: '#e879f9', initials: 'OR', time: '2 min' },
            { name: 'MangaKaNo', bg: '#0a2015', color: '#5cfcb4', initials: 'MN', time: '1h' },
            { name: 'SakuraHime', bg: '#1a0010', color: '#fc5c7d', initials: 'SH', time: '4h' },
          ].map(u => (
            <div key={u.name} className={styles.followerItem}>
              <div className={styles.followerAvatar} style={{ background: u.bg, color: u.color }}>{u.initials}</div>
              <span className={styles.followerName}>{u.name}</span>
              <span className={styles.followerTime}>{u.time}</span>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
