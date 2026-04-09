'use client'

import { useState } from 'react'
import { X, ZoomIn, Heart, Share2, Download } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

const CATS = ['Tudo', 'Arte', 'Cosplay', 'Screenshots', 'Fanart', 'Figura']

const ITEMS = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  category: ['Arte', 'Cosplay', 'Screenshots', 'Fanart', 'Figura'][i % 5],
  author: ['AkiraFan99', 'SakuraHime', 'YukiSenpai', 'NaruZuki', 'OtakuRei'][i % 5],
  initials: ['AK', 'SH', 'YS', 'NZ', 'OR'][i % 5],
  bg: ['#0a2015', '#1a0010', '#1a1000', '#0a0a2a', '#1a0030'][i % 5],
  color: ['#5cfcb4', '#fc5c7d', '#fcb45c', '#7c5cfc', '#e879f9'][i % 5],
  likes: Math.floor(Math.random() * 500) + 50,
  aspect: [1, 1.3, 0.8, 1, 1.2][i % 5],
}))

export default function GaleriaPage() {
  const [activecat, setActiveCat] = useState('Tudo')
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [lightbox, setLightbox] = useState<string | null>(null)

  const filtered = activecat === 'Tudo' ? ITEMS : ITEMS.filter(i => i.category === activecat)
  const lightboxItem = ITEMS.find(i => i.id === lightbox)

  const toggleLike = (id: string) => {
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div className={styles.page}>
      <Topbar title="Galeria" />

      {/* Lightbox */}
      {lightbox && lightboxItem && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <div className={styles.lightboxImg}>
              <div className={styles.lightboxPlaceholder}>
                <ZoomIn size={40} opacity={0.2} />
                <span>Imagem #{lightboxItem.id}</span>
              </div>
            </div>
            <div className={styles.lightboxInfo}>
              <div className={styles.lightboxHeader}>
                <div className={styles.lightboxAvatar} style={{ background: lightboxItem.bg, color: lightboxItem.color }}>
                  {lightboxItem.initials}
                </div>
                <div>
                  <div className={styles.lightboxAuthor}>{lightboxItem.author}</div>
                  <div className={styles.lightboxCat}>{lightboxItem.category}</div>
                </div>
                <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className={styles.lightboxActions}>
                <button className={`${styles.lbBtn} ${liked.has(lightboxItem.id) ? styles.lbLiked : ''}`} onClick={() => toggleLike(lightboxItem.id)}>
                  <Heart size={16} fill={liked.has(lightboxItem.id) ? 'currentColor' : 'none'} />
                  {lightboxItem.likes + (liked.has(lightboxItem.id) ? 1 : 0)}
                </button>
                <button className={styles.lbBtn}><Share2 size={16} /> Partilhar</button>
                <button className={styles.lbBtn}><Download size={16} /> Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.body}>
        {/* Cats */}
        <div className={styles.catsBar}>
          {CATS.map(c => (
            <button
              key={c}
              className={`${styles.catBtn} ${activecat === c ? styles.catActive : ''}`}
              onClick={() => setActiveCat(c)}
            >{c}</button>
          ))}
        </div>

        {/* Masonry grid */}
        <div className={styles.gridWrap}>
          <div className={styles.grid}>
            {filtered.map((item, i) => (
              <div
                key={item.id}
                className={`${styles.gridItem} animate-fade-in-up animate-delay-${Math.min((i % 4) + 1, 4)}`}
                onClick={() => setLightbox(item.id)}
              >
                <div
                  className={styles.gridImg}
                  style={{ aspectRatio: String(item.aspect) }}
                >
                  <div className={styles.gridOverlay}>
                    <div className={styles.gridLike}>
                      <Heart size={14} fill={liked.has(item.id) ? 'white' : 'none'} />
                      {item.likes}
                    </div>
                  </div>
                </div>
                <div className={styles.gridFooter}>
                  <div className={styles.gridAvatar} style={{ background: item.bg, color: item.color }}>
                    {item.initials}
                  </div>
                  <span className={styles.gridAuthor}>{item.author}</span>
                  <span className={styles.gridCat}>{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
