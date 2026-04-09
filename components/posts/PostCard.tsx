'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2, MoreHorizontal, Eye, EyeOff, Pin } from 'lucide-react'
import styles from './PostCard.module.css'

export interface PostData {
  id: string
  authorName: string
  authorHandle: string
  authorInitials: string
  authorBg: string
  authorColor: string
  role?: 'superuser' | 'mod' | null
  time: string
  text: string
  tags?: string[]
  imageCount?: number
  hasSpoiler?: boolean
  spoilerText?: string
  isPinned?: boolean
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  category?: string
}

export default function PostCard({ post, onDelete }: { post: PostData; onDelete?: (id: string) => void }) {
  const [liked, setLiked] = useState(post.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLike = () => {
    setLiked(l => !l)
    setLikeCount(c => liked ? c - 1 : c + 1)
  }

  const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  return (
    <article className={`${styles.card} ${post.isPinned ? styles.pinned : ''}`}>

      {post.isPinned && (
        <div className={styles.pinnedBadge}>
          <Pin size={11} />
          Publicacao fixada
        </div>
      )}

      <div className={styles.header}>
        <div
          className={styles.avatar}
          style={{ background: post.authorBg, color: post.authorColor }}
        >
          {post.authorInitials}
        </div>

        <div className={styles.authorInfo}>
          <div className={styles.authorName}>
            {post.authorName}
            {post.role === 'superuser' && <span className={styles.badgeSU}>Super User</span>}
            {post.role === 'mod' && <span className={styles.badgeMod}>Moderador</span>}
          </div>
          <div className={styles.meta}>
            <span>{post.authorHandle}</span>
            <span>{post.time}</span>
            {post.category && <span>{post.category}</span>}
          </div>
        </div>

        <div className={styles.moreWrap}>
          <button className={styles.moreBtn} onClick={() => setMenuOpen(m => !m)}>
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className={styles.menu}>
              <button className={styles.menuItem}>Guardar</button>
              <button className={styles.menuItem}>Partilhar</button>
              <button className={styles.menuItem}>Denunciar</button>
              {onDelete && (
                <button
                  className={`${styles.menuItem} ${styles.menuDanger}`}
                  onClick={() => { onDelete(post.id); setMenuOpen(false) }}
                >
                  Apagar post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.text}>{post.text}</p>

        {post.hasSpoiler && (
          <div
            className={`${styles.spoiler} ${spoilerRevealed ? styles.spoilerRevealed : ''}`}
            onClick={() => setSpoilerRevealed(true)}
          >
            {spoilerRevealed ? (
              <p>{post.spoilerText}</p>
            ) : (
              <>
                <EyeOff size={15} />
                Contem spoilers — clique para revelar
              </>
            )}
          </div>
        )}

        {post.imageCount === 1 && (
          <div className={styles.imageSingle}>
            <Eye size={32} opacity={0.2} />
            <span className={styles.imageLabel}>Imagem</span>
          </div>
        )}

        {post.imageCount && post.imageCount > 1 && (
          <div className={styles.imageGrid}>
            {Array.from({ length: Math.min(post.imageCount, 4) }).map((_, i) => (
              <div key={i} className={styles.imageCell}>
                {i === 3 && post.imageCount! > 4 && (
                  <span className={styles.imageMore}>+{post.imageCount! - 3}</span>
                )}
                {!(i === 3 && post.imageCount! > 4) && <Eye size={24} opacity={0.2} />}
              </div>
            ))}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map(tag => (
              <span key={tag} className={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
          onClick={handleLike}
        >
          <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          <span>{formatCount(likeCount)}</span>
        </button>

        <button className={styles.actionBtn}>
          <MessageCircle size={15} />
          <span>{formatCount(post.comments)}</span>
        </button>

        <button className={styles.actionBtn}>
          <Share2 size={15} />
          <span>Partilhar</span>
        </button>
      </div>
    </article>
  )
}
