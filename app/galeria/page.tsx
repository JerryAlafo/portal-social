'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ZoomIn, Heart, Share2, Download, Plus, Image as ImageIcon, Loader } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Topbar from '@/components/layout/Topbar'
import { uploadImage } from '@/services/upload'
import { useToast } from '@/hooks/useToast'
import { useGuestMode } from '@/components/layout/GuestModeProvider'
import styles from './page.module.css'

const CATS = ['Tudo', 'Arte', 'Cosplay', 'Screenshots', 'Fanart', 'Figura']
const UPLOAD_CATS = ['Arte', 'Cosplay', 'Screenshots', 'Fanart', 'Figura']

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
  const { data: session } = useSession()
  const { showToast } = useToast()
  const { isGuest, requestLogin } = useGuestMode()
  const [activeCat, setActiveCat] = useState('Tudo')
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCategory, setUploadCategory] = useState('Arte')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadImageUrl, setUploadImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    const fetchLikes = async () => {
      if (!session?.user) return
      try {
        const res = await fetch('/api/gallery/likes')
        const data = await res.json()
        if (data.data) {
          const likedSet = new Set<string>(data.data.map((l: { item_id: string }) => l.item_id))
          setLiked(likedSet)
        }
      } catch (err) {
        console.error('Erro ao carregar likes:', err)
      }
    }
    fetchLikes()
  }, [session])

  const filtered = activeCat === 'Tudo' ? items : items.filter(i => 
    i.category?.toLowerCase().includes(activeCat.toLowerCase())
  )
  const lightboxItem = items.find(i => i.id === lightbox)

  const requireLogin = (detail?: { title?: string; message?: string; returnTo?: string }) => {
    if (!isGuest && session?.user) return true

    requestLogin(detail)
    return false
  }

  const toggleLike = async (id: string) => {
    if (!requireLogin({
      title: 'Like protegido',
      message: 'Entra na tua conta para gostar de imagens da galeria.',
    })) return

    const wasLiked = liked.has(id)
    setLiked(prev => { const n = new Set(prev); wasLiked ? n.delete(id) : n.add(id); return n })
    try {
      const res = await fetch('/api/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'like' }),
      })
      const json = await res.json()
      if (json.error) {
        setLiked(prev => { const n = new Set(prev); wasLiked ? n.add(id) : n.delete(id); return n })
        showToast(json.error, 'error')
      } else if (json.data) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, likes_count: json.data.likes_count } : item))
      }
    } catch {
      setLiked(prev => { const n = new Set(prev); wasLiked ? n.add(id) : n.delete(id); return n })
      showToast('Erro ao dar like', 'error')
    }
  }

  const handleShare = async (item: GalleryItem) => {
    const url = `${window.location.origin}/galeria/${item.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.title, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Link copiado!', 'success')
    }
  }

  const handleDownload = async (item: GalleryItem) => {
    if (!item.image_url) return
    try {
      const res = await fetch(item.image_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.title || 'imagem'
      a.click()
      URL.revokeObjectURL(url)
      showToast('Imagem guardada!', 'success')
    } catch {
      showToast('Erro ao guardar imagem', 'error')
    }
  }

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    const preview = URL.createObjectURL(file)
    setUploadPreview(preview)
  }

  const handleUpload = async () => {
    if (!requireLogin({
      title: 'Publicacao protegida',
      message: 'Entra ou cria uma conta para publicar na galeria.',
    })) return

    if (!uploadFile || !uploadTitle.trim() || uploading) return
    setUploading(true)
    try {
      let imageUrl = uploadImageUrl
      if (uploadFile && !imageUrl) {
        imageUrl = await uploadImage(uploadFile, 'gallery')
      }
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          category: uploadCategory,
          image_url: imageUrl,
        }),
      })
      const json = await res.json()
      if (json.data) {
        setItems(prev => [json.data, ...prev])
        setShowUploadModal(false)
        setUploadTitle('')
        setUploadCategory('Arte')
        setUploadFile(null)
        setUploadPreview(null)
        setUploadImageUrl(null)
      }
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
    } finally {
      setUploading(false)
    }
  }

  const openUploadModal = () => {
    if (!requireLogin({
      title: 'Publicacao protegida',
      message: 'Entra ou cria uma conta para publicar na galeria.',
    })) return

    setUploadTitle('')
    setUploadCategory('Arte')
    setUploadFile(null)
    setUploadPreview(null)
    setUploadImageUrl(null)
    setShowUploadModal(true)
  }

  const closeUploadModal = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview)
    setShowUploadModal(false)
  }

  const getInitials = (item: GalleryItem) => {
    return item.author?.avatar_initials || item.author?.username?.slice(0, 2).toUpperCase() || '??'
  }

  const getAvatarUrl = (item: GalleryItem) => {
    return item.author?.avatar_url ?? null
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
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)} style={{ overflow: 'auto' }}>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflow: 'auto' }}>
            <div className={styles.lightboxImg} style={{ maxHeight: 'calc(90vh - 100px)', overflow: 'hidden' }}>
              {lightboxItem.image_url ? (
                <img src={lightboxItem.image_url} alt={lightboxItem.title || 'Imagem'} style={{ maxHeight: '50vh', width: 'auto', objectFit: 'contain' }} />
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
                  {getAvatarUrl(lightboxItem)
                    ? <img src={getAvatarUrl(lightboxItem)!} alt={lightboxItem.author?.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : getInitials(lightboxItem)}
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
                <button className={styles.lbBtn} onClick={() => handleShare(lightboxItem)}><Share2 size={16} /> Partilhar</button>
                <button className={styles.lbBtn} onClick={() => handleDownload(lightboxItem)}><Download size={16} /> Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.catsBar}>
          <button
            className={styles.uploadBtn}
            onClick={openUploadModal}
          >
            <Plus size={16} /> Publicar
          </button>
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
                const colors = getColors(item)
                const aspect = item.width && item.height && item.width > 0 && item.height > 0 
                  ? Math.max(0.5, Math.min(2, item.width / item.height)) 
                  : 1

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
                        {getAvatarUrl(item)
                          ? <img src={getAvatarUrl(item)!} alt={item.author?.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : getInitials(item)}
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

      {showUploadModal && (
        <div className="modal-overlay" onClick={closeUploadModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Publicar na Galeria</h3>
              <button className="modal-close" onClick={closeUploadModal}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 16 }}>
              <input
                className="modal-input"
                placeholder="Título da imagem"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <select
                className="modal-input"
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                style={{ marginBottom: 12 }}
              >
                {UPLOAD_CATS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePickFile}
              />
              <div
                className={styles.uploadDropzone}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadPreview ? (
                  <img src={uploadPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
                    <ImageIcon size={32} opacity={0.5} />
                    <p style={{ marginTop: 8 }}>Clica para selecionar uma imagem</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-ok-btn"
                onClick={handleUpload}
                disabled={uploading || !uploadFile || !uploadTitle.trim()}
              >
                {uploading ? <><Loader size={14} className="spin" /> A publicar...</> : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
