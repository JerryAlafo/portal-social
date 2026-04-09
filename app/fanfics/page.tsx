'use client'

import { useState } from 'react'
import { BookOpen, Heart, Eye, Clock, Filter } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

const GENRES = ['Tudo', 'Isekai', 'Shonen', 'Shojo', 'Seinen', 'Romance', 'Aventura', 'Comedia']
const STATUS = ['Todos', 'Em curso', 'Completo', 'Pausado']

const FANFICS = [
  { id: '1', title: 'O Caminho do Summoner Solitario', genre: 'Isekai', status: 'Em curso', chapters: 24, words: '142k', author: 'Jerry Otaku', authorInitials: 'JA', authorBg: '#12092a', authorColor: '#9b7fff', reads: 48000, likes: 1200, updated: 'Ha 3 dias', summary: 'Depois de ser summonado para outro mundo sem qualquer habilidade especial, Kenji descobre que o seu poder e chamar aliados do seu mundo original — mas com um custo emocional inesperado...' },
  { id: '2', title: 'Cartas Para Nenhum Lugar', genre: 'Shojo', status: 'Completo', chapters: 8, words: '34k', author: 'Jerry Otaku', authorInitials: 'JA', authorBg: '#12092a', authorColor: '#9b7fff', reads: 12000, likes: 640, updated: 'Completo', summary: 'Uma historia sobre duas otakus que se conhecem num forum de manga e comecam a trocar cartas fisicas — numa era em que ninguem o faz...' },
  { id: '3', title: 'Hashira de Aço', genre: 'Shonen', status: 'Em curso', chapters: 31, words: '198k', author: 'YukiSenpai', authorInitials: 'YS', authorBg: '#1a1000', authorColor: '#fcb45c', reads: 67000, likes: 2100, updated: 'Ha 1 dia', summary: 'E se Tanjiro tivesse nascido numa familia de fabricantes de espadas? Uma historia alternativa de Demon Slayer com novas rivalidades e um caminho completamente diferente para o personagem.' },
  { id: '4', title: 'O Ultimo Magi', genre: 'Aventura', status: 'Em curso', chapters: 15, words: '89k', author: 'AkiraFan99', authorInitials: 'AK', authorBg: '#0a2015', authorColor: '#5cfcb4', reads: 23000, likes: 780, updated: 'Ha 5 dias', summary: 'Num mundo onde a magia esta a desaparecer, o ultimo mago tem de encontrar os artefactos esquecidos antes que as trevas consumam tudo. Inspirado em Magi: The Labyrinth of Magic.' },
  { id: '5', title: 'Primavera em Shibuya', genre: 'Romance', status: 'Completo', chapters: 12, words: '56k', author: 'SakuraHime', authorInitials: 'SH', authorBg: '#1a0010', authorColor: '#fc5c7d', reads: 34000, likes: 1450, updated: 'Completo', summary: 'Duas estudantes que sempre foram rivais no clube de manga descobrem que a rivalidade tem raizes mais profundas do que qualquer uma delas imaginava.' },
  { id: '6', title: 'Rei Sem Trono', genre: 'Seinen', status: 'Pausado', chapters: 7, words: '41k', author: 'NaruZuki', authorInitials: 'NZ', authorBg: '#0a0a2a', authorColor: '#7c5cfc', reads: 8900, likes: 310, updated: 'Ha 3 semanas', summary: 'Um ex-rei destronado torna-se escriba no reino que conquistou. Uma historia de politica, traicao e redenção muito ao estilo de Vinland Saga.' },
]

const STATUS_COLORS: Record<string, string> = {
  'Em curso': 'var(--green)',
  'Completo': 'var(--accent2)',
  'Pausado': 'var(--amber)',
}

export default function FanficsPage() {
  const [activeGenre, setActiveGenre] = useState('Tudo')
  const [activeStatus, setActiveStatus] = useState('Todos')
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<'recent' | 'reads' | 'likes'>('recent')

  const filtered = FANFICS
    .filter(f => activeGenre === 'Tudo' || f.genre === activeGenre)
    .filter(f => activeStatus === 'Todos' || f.status === activeStatus)
    .sort((a, b) => sort === 'reads' ? b.reads - a.reads : sort === 'likes' ? b.likes - a.likes : 0)

  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n)

  return (
    <div className={styles.page}>
      <Topbar title="Fanfics" />
      <div className={styles.body}>
        <div className={styles.mainCol}>
          <div className={styles.controls}>
            <div className={styles.genres}>
              {GENRES.map(g => (
                <button key={g} className={`${styles.chip} ${activeGenre === g ? styles.chipActive : ''}`} onClick={() => setActiveGenre(g)}>{g}</button>
              ))}
            </div>
            <div className={styles.filters}>
              <div className={styles.statusRow}>
                {STATUS.map(s => (
                  <button key={s} className={`${styles.statusBtn} ${activeStatus === s ? styles.statusActive : ''}`} onClick={() => setActiveStatus(s)}>{s}</button>
                ))}
              </div>
              <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
                <option value="recent">Mais recentes</option>
                <option value="reads">Mais lidas</option>
                <option value="likes">Mais gostadas</option>
              </select>
            </div>
          </div>

          <div className={styles.list}>
            {filtered.map(f => (
              <div key={f.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.genreStatus}>
                    <span className={styles.genre}>{f.genre}</span>
                    <span className={styles.status} style={{ color: STATUS_COLORS[f.status] }}>
                      <span className={styles.statusDot} style={{ background: STATUS_COLORS[f.status] }} />
                      {f.status}
                    </span>
                  </div>
                  <div className={styles.authorRow}>
                    <div className={styles.authorAvatar} style={{ background: f.authorBg, color: f.authorColor }}>{f.authorInitials}</div>
                    <span className={styles.authorName}>{f.author}</span>
                  </div>
                </div>
                <h3 className={styles.cardTitle}>{f.title}</h3>
                <p className={styles.cardSummary}>{f.summary}</p>
                <div className={styles.cardMeta}>
                  <span><BookOpen size={13} /> {f.chapters} cap.</span>
                  <span>{f.words} palavras</span>
                  <span><Eye size={13} /> {fmt(f.reads)}</span>
                  <span><Clock size={13} /> {f.updated}</span>
                </div>
                <div className={styles.cardFooter}>
                  <button
                    className={`${styles.likeBtn} ${liked.has(f.id) ? styles.likeBtnActive : ''}`}
                    onClick={() => setLiked(prev => { const n = new Set(prev); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n })}
                  >
                    <Heart size={14} fill={liked.has(f.id) ? 'currentColor' : 'none'} />
                    {fmt(f.likes + (liked.has(f.id) ? 1 : 0))}
                  </button>
                  <button className={styles.readBtn}>Ler agora</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.rightPanel}>
          <p className={styles.panelTitle}>Top fanfics</p>
          {[...FANFICS].sort((a,b) => b.reads - a.reads).slice(0, 5).map((f, i) => (
            <div key={f.id} className={styles.topItem}>
              <span className={styles.topRank}>{String(i+1).padStart(2,'0')}</span>
              <div>
                <div className={styles.topTitle}>{f.title}</div>
                <div className={styles.topMeta}>{fmt(f.reads)} leituras · {f.author}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
