'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Loader2, Check, Copy, Trash2 } from 'lucide-react'
import type { Post, Comment } from '@/types'
import { getComments, addComment, deleteComment } from '@/services/comments'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: Post
  onDelete?: (id: string) => void
  onLike?: (id: string) => void
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'Agora mesmo'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export default function PostCard({ post, onDelete, onLike }: PostCardProps) {
  const { data: session } = useSession()

  const [menuOpen,        setMenuOpen]        = useState(false)
  const [commentsOpen,    setCommentsOpen]    = useState(false)
  const [comments,        setComments]        = useState<Comment[]>([])
  const [commentsLoaded,  setCommentsLoaded]  = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText,     setCommentText]     = useState('')
  const [submitting,      setSubmitting]      = useState(false)
  const [copied,          setCopied]          = useState(false)
  const [shareCount,      setShareCount]      = useState(post.shares_count)

  const myInitials = session?.user?.avatar_initials
    || session?.user?.name?.slice(0, 2).toUpperCase()
    || '?'

  const myId   = session?.user?.id ?? ''
  const myRole = (session?.user as { role?: string })?.role ?? ''

  // ── Comments ─────────────────────────────────────────────

  const handleToggleComments = async () => {
    const next = !commentsOpen
    setCommentsOpen(next)
    if (next && !commentsLoaded) {
      setLoadingComments(true)
      try {
        const res = await getComments(post.id)
        if (res.data) setComments(res.data)
        setCommentsLoaded(true)
      } finally {
        setLoadingComments(false)
      }
    }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await addComment(post.id, commentText.trim())
      if (res.data) {
        setComments(prev => [...prev, res.data!])
        setCommentText('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(post.id, commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch { /* ignore */ }
  }

  // ── Share ────────────────────────────────────────────────

  const handleShare = async () => {
    setMenuOpen(false)
    const url = `${window.location.origin}/feed?post=${post.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.author.display_name} no PORTAL`,
          text: post.content.slice(0, 100),
          url,
        })
      } catch { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }

    // Increment counter (non-blocking)
    fetch(`/api/posts/${post.id}/share`, { method: 'POST' })
      .then(() => setShareCount(n => n + 1))
      .catch(() => { /* non-critical */ })
  }

  const { author } = post

  return (
    <article className={styles.card}>

      {/* ── Header ─────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.avatar} style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
          {author.avatar_url
            ? <img src={author.avatar_url} alt={author.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : author.avatar_initials}
        </div>

        <div className={styles.authorInfo}>
          <div className={styles.authorName}>
            {author.display_name}
            {author.role === 'superuser' && <span className={styles.badgeSU}>Super User</span>}
            {author.role === 'mod'       && <span className={styles.badgeMod}>Moderador</span>}
          </div>
          <div className={styles.meta}>
            <span>@{author.username}</span>
            <span>{timeAgo(post.created_at)}</span>
            {post.category && <span>{post.category}</span>}
          </div>
        </div>

        <div className={styles.moreWrap}>
          <button className={styles.moreBtn} onClick={() => setMenuOpen(m => !m)}>
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className={styles.menu}>
              <button className={styles.menuItem} onClick={handleShare}>
                <Share2 size={13} /> Partilhar
              </button>
              <button className={styles.menuItem} onClick={handleShare}>
                <Copy size={13} /> Copiar link
              </button>
              <button className={styles.menuItem}>Guardar</button>
              <button className={styles.menuItem}>Denunciar</button>
              {onDelete && (
                <button
                  className={`${styles.menuItem} ${styles.menuDanger}`}
                  onClick={() => { onDelete(post.id); setMenuOpen(false) }}
                >
                  <Trash2 size={13} /> Apagar post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className={styles.body}>
        <p className={styles.text}>{post.content}</p>
        {post.image_url && (
          <img src={post.image_url} alt="Imagem do post" className={styles.postImage} />
        )}
      </div>

      {/* ── Actions ────────────────────────────────────── */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${post.liked_by_me ? styles.liked : ''}`}
          onClick={() => onLike?.(post.id)}
        >
          <Heart size={15} fill={post.liked_by_me ? 'currentColor' : 'none'} />
          <span>{fmt(post.likes_count)}</span>
        </button>

        <button
          className={`${styles.actionBtn} ${commentsOpen ? styles.commentActive : ''}`}
          onClick={handleToggleComments}
        >
          <MessageCircle size={15} />
          <span>{fmt(post.comments_count)}</span>
        </button>

        <button className={styles.actionBtn} onClick={handleShare}>
          {copied
            ? <><Check size={15} /><span>Copiado!</span></>
            : <><Share2 size={15} /><span>{fmt(shareCount)}</span></>
          }
        </button>
      </div>

      {/* ── Comments section ───────────────────────────── */}
      {commentsOpen && (
        <div className={styles.commentsSection}>

          {/* Loading */}
          {loadingComments && (
            <div className={styles.commentsLoading}>
              <Loader2 size={16} className="spin" />
            </div>
          )}

          {/* Empty */}
          {!loadingComments && comments.length === 0 && (
            <p className={styles.commentsEmpty}>Ainda não há comentários. Sê o primeiro!</p>
          )}

          {/* Comment list */}
          {comments.map(c => {
            const canDelete = c.author_id === myId || myRole === 'mod' || myRole === 'superuser'
            return (
              <div key={c.id} className={styles.commentItem}>
                <div className={styles.commentAvatar}>
                  {c.author.avatar_url
                    ? <img src={c.author.avatar_url} alt={c.author.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : c.author.avatar_initials}
                </div>
                <div className={styles.commentBubble}>
                  <div className={styles.commentMeta}>
                    <span className={styles.commentAuthor}>{c.author.display_name}</span>
                    <span className={styles.commentHandle}>@{c.author.username}</span>
                    <span className={styles.commentTime}>{timeAgo(c.created_at)}</span>
                    {canDelete && (
                      <button
                        className={styles.commentDeleteBtn}
                        onClick={() => handleDeleteComment(c.id)}
                        title="Apagar comentário"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <div className={styles.commentText}>{c.content}</div>
                </div>
              </div>
            )
          })}

          {/* Input */}
          <div className={styles.commentInputRow}>
            <div className={styles.commentAvatar}>
              {myInitials}
            </div>
            <input
              className={styles.commentField}
              placeholder="Adicionar um comentário..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmitComment()
                }
              }}
              maxLength={500}
            />
            <button
              className={styles.commentSendBtn}
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
            </button>
          </div>

        </div>
      )}

    </article>
  )
}
