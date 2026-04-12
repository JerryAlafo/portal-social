'use client'

import { useState, useEffect } from 'react'
import { X, ZoomIn, Heart, Share2, Download } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

const CATS = ['Tudo', 'Arte', 'Cosplay', 'Screenshots', 'Fanart', 'Figura']

interface GalleryItem {
  id: string
  title: string
  category: string
  image_url: string
  author_id: string
  likes_count: number
  width: number
  height: number
  created_at: string
  author?: {
    id: string
    username: string
    display_name: string
    avatar_initials: string
    avatar_url?: string
  }
}

export default function GaleriaPage() {
  const [activeCat, setActiveCat] = useState('Tudo')
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/gallery')
        const data = await res.json()
        if (data.data) setItems(data.data)
      } catch (err) {
        console.error('Erro ao carregar galeria:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGallery()
  }, [])

  const filtered = activeCat === 'Tudo' ? items : items.filter(i => 
    i.category?.toLowerCase().includes(activeCat.toLowerCase())
  )
  const lightboxItem = items.find(i => i.id === lightbox)

  const toggleLike = (id: string) => {
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const getInitials = (item: GalleryItem) => {
    return item.author?.avatar_initials || item.author?.username?.slice(0, 2).toUpperCase() || '??'
  }

  const getColors = (item: GalleryItem) => {
    const colors = [
      { bg: '#0a2015', color: '#5cfcb4' },
      { bg: '#1a0010', color: '#fc5c7d' },
      { bg: '#1a1000', color: '#fcb45c' },
      { bg: '#0a0a2a', color: '#7c5cfc' },
      { bg: '#1a0030', color: '#e879f9' },
    ]
    const index = item.author?.username ? item.author.username.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Topbar title="Galeria" />
        <div className={styles.body}>
          <div className={styles.loading}>A carregar galeria...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Topbar title="Galeria" />

      {lightbox && lightboxItem && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <div className={styles.lightboxImg}>
              {lightboxItem.image_url ? (
                <img src={lightboxItem.image_url} alt={lightboxItem.title || 'Imagem'} />
              ) : (
                <div className={styles.lightboxPlaceholder}>
                  <ZoomIn size={40} opacity={0.2} />
                  <span>Imagem #{lightboxItem.id}</span>
                </div>
              )}
            </div>
            <div className={styles.lightboxInfo}>
              <div className={styles.lightboxHeader}>
                <div className={styles.lightboxAvatar} style={{ background: getColors(lightboxItem).bg, color: getColors(lightboxItem).color }}>
                  {getInitials(lightboxItem)}
                </div>
                <div>
                  <div className={styles.lightboxAuthor}>{lightboxItem.author?.username || 'Autor'}</div>
                  <div className={styles.lightboxCat}>{lightboxItem.category}</div>
                </div>
                <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className={styles.lightboxActions}>
                <button className={`${styles.lbBtn} ${liked.has(lightboxItem.id) ? styles.lbLiked : ''}`} onClick={() => toggleLike(lightboxItem.id)}>
                  <Heart size={16} fill={liked.has(lightboxItem.id) ? 'currentColor' : 'none'} />
                  {lightboxItem.likes_count + (liked.has(lightboxItem.id) ? 1 : 0)}
                </button>
                <button className={styles.lbBtn}><Share2 size={16} /> Partilhar</button>
                <button className={styles.lbBtn}><Download size={16} /> Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.catsBar}>
          {CATS.map(c => (
            <button
              key={c}
              className={`${styles.catBtn} ${activeCat === c ? styles.catActive : ''}`}
              onClick={() => setActiveCat(c)}
            >{c}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>Ainda nao ha imagens na galeria.</div>
        ) : (
          <div className={styles.gridWrap}>
            <div className={styles.grid}>
              {filtered.map((item, i) => {
                const aspect = item.width && item.height ? item.width / item.height : 1
                const colors = getColors(item)

                return (
                  <div
                    key={item.id}
                    className={`${styles.gridItem} animate-fade-in-up animate-delay-${Math.min((i % 4) + 1, 4)}`}
                    onClick={() => setLightbox(item.id)}
                  >
                    <div
                      className={styles.gridImg}
                      style={{ aspectRatio: String(aspect) }}
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title || 'Imagem'} />
                      ) : (
                        <div className={styles.gridPlaceholder}>
                          <ZoomIn size={24} opacity={0.3} />
                        </div>
                      )}
                      <div className={styles.gridOverlay}>
                        <div className={styles.gridLike}>
                          <Heart size={14} fill={liked.has(item.id) ? 'white' : 'none'} />
                          {item.likes_count}
                        </div>
                      </div>
                    </div>
                    <div className={styles.gridFooter}>
                      <div className={styles.gridAvatar} style={{ background: colors.bg, color: colors.color }}>
                        {getInitials(item)}
                      </div>
                      <span className={styles.gridAuthor}>{item.author?.username || 'Autor'}</span>
                      <span className={styles.gridCat}>{item.category}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
