'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Loader2, Check, Copy, Trash2, Pencil, Reply, X, AlertTriangle } from 'lucide-react'
import type { Post, Comment } from '@/types'
import { getComments, addComment, editComment, deleteComment, likeComment } from '@/services/comments'
import { reportPost } from '@/services/posts'
import { useGuestMode } from '@/components/layout/GuestModeProvider'
import styles from './PostCard.module.css'

interface PostCardProps {
  post: Post
  onDelete?: (id: string) => void
  onLike?: (id: string) => void
  onReport?: (id: string) => void
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

interface CommentItemProps {
  comment: Comment
  myId: string
  myRole: string
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => void
  onLike: (id: string) => void
  onReply: (parentId: string) => void
  loadingReplies: boolean
  onLoadReplies: (commentId: string) => void
  depth?: number
}

function CommentItem({ comment, myId, myRole, onDelete, onEdit, onLike, onReply, loadingReplies, onLoadReplies, depth = 0 }: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [showReplies, setShowReplies] = useState(false)

  const canEdit = comment.author_id === myId
  const canDelete = comment.author_id === myId || myRole === 'mod' || myRole === 'superuser'

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== comment.content) {
      onEdit(comment.id, editText.trim())
    }
    setEditing(false)
  }

  const wasEdited =
    Boolean(comment.updated_at) &&
    new Date(comment.updated_at as string).getTime() - new Date(comment.created_at).getTime() > 1000

  if (!comment.author) return null

  return (
    <div className={styles.commentItem} style={{ marginLeft: depth > 0 ? 24 : 0 }}>
      <Link href={`/perfil/${comment.author.username}`} className={styles.commentAvatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
        {comment.author.avatar_url
          ? <img src={comment.author.avatar_url} alt={comment.author.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : comment.author.avatar_initials}
      </Link>
      <div className={styles.commentBubble}>
        <div className={styles.commentMeta}>
          <Link href={`/perfil/${comment.author.username}`} className={styles.commentAuthor} style={{ textDecoration: 'none', color: 'inherit' }}>{comment.author.display_name}</Link>
          <Link href={`/perfil/${comment.author.username}`} className={styles.commentHandle} style={{ textDecoration: 'none' }}>@{comment.author.username}</Link>
          <span className={styles.commentTime}>{timeAgo(comment.created_at)}</span>
          {wasEdited && <span className={styles.commentEdited}>(editado)</span>}
        </div>

        {editing ? (
          <div className={styles.editForm}>
            <input
              className={styles.editInput}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') { setEditText(comment.content); setEditing(false) } }}
              maxLength={500}
              autoFocus
            />
            <div className={styles.editActions}>
              <button className={styles.editSaveBtn} onClick={handleSaveEdit}>Guardar</button>
              <button className={styles.editCancelBtn} onClick={() => { setEditText(comment.content); setEditing(false) }}><X size={12} /></button>
            </div>
          </div>
        ) : (
          <div className={styles.commentText}>{comment.content}</div>
        )}

        <div className={styles.commentActions}>
          <button
            className={`${styles.commentActionBtn} ${comment.liked_by_me ? styles.commentLiked : ''}`}
            onClick={() => onLike(comment.id)}
          >
            <Heart size={11} fill={comment.liked_by_me ? 'currentColor' : 'none'} />
            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
          </button>

          <button className={styles.commentActionBtn} onClick={() => onReply(comment.id)}>
            <Reply size={11} />
          </button>

          {canEdit && !editing && (
            <button className={styles.commentActionBtn} onClick={() => setEditing(true)}>
              <Pencil size={11} />
            </button>
          )}

          {canDelete && (
            <button
              className={`${styles.commentActionBtn} ${styles.commentDeleteAction}`}
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        {!depth && (
          <button className={styles.repliesToggle} onClick={() => { setShowReplies(!showReplies); if (!showReplies) onLoadReplies(comment.id) }}>
            {loadingReplies ? <Loader2 size={10} className="spin" /> : showReplies ? 'Ocultar respostas' : `Ver respostas`}
          </button>
        )}
      </div>
    </div>
  )
}

export default function PostCard({ post, onDelete, onLike, onReport }: PostCardProps) {
  const { data: session } = useSession()
  const { isGuest, requestLogin } = useGuestMode()

  const [menuOpen, setMenuOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
   const [spoilerRevealed, setSpoilerRevealed] = useState(false)
   const [sensitiveRevealed, setSensitiveRevealed] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareCount, setShareCount] = useState(post.shares_count)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, Comment[]>>({})
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState<string>('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [showReportSuccess, setShowReportSuccess] = useState(false)
  const [showReportError, setShowReportError] = useState(false)
  const [reportError, setReportError] = useState<string>('')

  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const moreBtnRef = useRef<HTMLButtonElement>(null)
  const menuPortalRef = useRef<HTMLDivElement>(null)
  const reportModalRef = useRef<HTMLDivElement>(null)
  const reportSuccessRef = useRef<HTMLDivElement>(null)
  const reportErrorRef = useRef<HTMLDivElement>(null)

  const myInitials = session?.user?.avatar_initials
    || session?.user?.name?.slice(0, 2).toUpperCase()
    || '?'

  const myId = session?.user?.id ?? ''
  const myRole = (session?.user as { role?: string })?.role ?? ''
   const isSpoiler = Boolean((post as Post).is_spoiler)
   const isSensitive = Boolean((post as Post).is_sensitive)
   const canReveal = !isSpoiler || spoilerRevealed
   const canRevealSensitive = !isSensitive || sensitiveRevealed

  const openMenu = useCallback(() => {
    if (moreBtnRef.current) {
      const rect = moreBtnRef.current.getBoundingClientRect()
      setMenuPosition({ top: rect.bottom + 4, left: rect.right - 155 })
      setMenuOpen(true)
    }
  }, [])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    setMenuPosition(null)
  }, [])

  const requireLogin = useCallback((detail?: { title?: string; message?: string; returnTo?: string }) => {
    if (!isGuest) return true

    requestLogin(detail)
    return false
  }, [isGuest, requestLogin])

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        moreBtnRef.current && !moreBtnRef.current.contains(e.target as Node) &&
        menuPortalRef.current && !menuPortalRef.current.contains(e.target as Node)
      ) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen, closeMenu])

  useEffect(() => {
    if (!reportModalOpen) return
    const handleClick = (e: MouseEvent) => {
      if (reportModalRef.current && !reportModalRef.current.contains(e.target as Node)) {
        setReportModalOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [reportModalOpen])

  useEffect(() => {
    if (!showReportSuccess) return
    const handleClick = (e: MouseEvent) => {
      if (reportSuccessRef.current && !reportSuccessRef.current.contains(e.target as Node)) {
        setShowReportSuccess(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showReportSuccess])

  useEffect(() => {
    if (!showReportError) return
    const handleClick = (e: MouseEvent) => {
      if (reportErrorRef.current && !reportErrorRef.current.contains(e.target as Node)) {
        setShowReportError(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showReportError])

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
    if (!requireLogin({
      title: 'Comentario protegido',
      message: 'Entra na tua conta para comentar publicacoes.',
    })) return

    if (!commentText.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await addComment(post.id, commentText.trim(), replyingTo ?? undefined)
      if (res.data) {
        if (replyingTo) {
          setReplies(prev => ({ ...prev, [replyingTo]: [...(prev[replyingTo] || []), res.data!] }))
          setComments(prev => prev.map(c => c.id === replyingTo ? { ...c, likes_count: c.likes_count } : c))
        } else {
          setComments(prev => [...prev, res.data!])
        }
        setCommentText('')
        setReplyingTo(null)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string, content: string) => {
    if (!requireLogin()) return

    try {
      const res = await editComment(post.id, commentId, content)
      if (res.data) {
        if (replyingTo) {
          setReplies(prev => ({
            ...prev,
            [replyingTo]: prev[replyingTo].map(c => c.id === commentId ? res.data! : c)
          }))
        } else {
          setComments(prev => prev.map(c => c.id === commentId ? res.data! : c))
        }
      }
    } catch { /* ignore */ }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!requireLogin()) return

    try {
      await deleteComment(post.id, commentId)
      if (replyingTo) {
        setReplies(prev => ({
          ...prev,
          [replyingTo]: prev[replyingTo].filter(c => c.id !== commentId)
        }))
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId))
      }
    } catch { /* ignore */ }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!requireLogin({
      title: 'Like protegido',
      message: 'Entra na tua conta para gostar de comentarios.',
    })) return

    try {
      const res = await likeComment(post.id, commentId)
      if (res.data) {
        const updateComment = (comments: Comment[]) =>
          comments.map(c => c.id === commentId ? { ...c, liked_by_me: res.data!.liked, likes_count: res.data!.likes_count } : c)
        if (replyingTo) {
          setReplies(prev => ({ ...prev, [replyingTo]: updateComment(prev[replyingTo] || []) }))
        } else {
          setComments(updateComment)
        }
      }
    } catch { /* ignore */ }
  }

  const handleLoadReplies = async (commentId: string) => {
    setLoadingReplies(true)
    try {
      const res = await fetch(`/api/comments/${post.id}?include_replies=true`)
      const json = await res.json()
      if (json.data) {
        setReplies(prev => ({ ...prev, [commentId]: json.data.filter((c: Comment) => c.parent_id === commentId) }))
      }
    } catch { /* ignore */ }
    finally { setLoadingReplies(false) }
  }

  const handleReply = (parentId: string) => {
    if (!requireLogin({
      title: 'Resposta protegida',
      message: 'Entra na tua conta para responder comentarios.',
    })) return

    setReplyingTo(parentId)
    const parentComment = comments.find(c => c.id === parentId)
    if (parentComment && parentComment.author) {
      setCommentText(`@${parentComment.author.username} `)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post de ${post.author!.display_name} no PORTAL`,
          text: post.content.slice(0, 100),
          url,
        })
      } catch { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }

    fetch(`/api/posts/${post.id}/share`, { method: 'POST' })
      .then(() => setShareCount(n => n + 1))
      .catch(() => { /* non-critical */ })
  }

  const handleOpenReport = () => {
    if (!requireLogin({
      title: 'Denuncia protegida',
      message: 'Entra na tua conta para denunciar conteudo.',
    })) return

    closeMenu()
    setReportModalOpen(true)
    setReportReason('')
    setReportDescription('')
  }

  const handleSubmitReport = async () => {
    if (!requireLogin()) return

    if (!reportReason || reportSubmitting) return
    setReportSubmitting(true)
    try {
      const res = await reportPost(post.id, reportReason, reportDescription || undefined)
      setReportModalOpen(false)
      if (res.error) {
        setReportError(res.error)
        setShowReportError(true)
      } else {
        onReport?.(post.id)
        setShowReportSuccess(true)
      }
    } catch {
      setReportModalOpen(false)
      setReportError('Erro ao enviar denúncia.')
      setShowReportError(true)
    } finally {
      setReportSubmitting(false)
    }
  }

  const replyingToComment = replyingTo ? comments.find(c => c.id === replyingTo) : null

  const { author } = post

  if (!author) return null

  return (
    <article className={styles.card}>

      <div className={styles.header}>
        <Link href={`/perfil/${author.username}`} className={styles.avatar} style={{ background: 'var(--bg4)', color: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          {author.avatar_url
            ? <img src={author.avatar_url} alt={author.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : author.avatar_initials}
        </Link>

        <div className={styles.authorInfo}>
          <Link href={`/perfil/${author.username}`} className={styles.authorName} style={{ textDecoration: 'none', color: 'inherit' }}>
            {author.display_name}
            {author.role === 'superuser' && <span className={styles.badgeSU}>Super User</span>}
            {author.role === 'mod' && <span className={styles.badgeMod}>Moderador</span>}
          </Link>
          <div className={styles.meta}>
            <Link href={`/perfil/${author.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>@{author.username}</Link>
            <span>{timeAgo(post.created_at)}</span>
            {post.category && <span>{post.category}</span>}
          </div>
        </div>

        <div className={styles.moreWrap}>
          <button ref={moreBtnRef} className={styles.moreBtn} onClick={openMenu}>
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && typeof document !== 'undefined' && createPortal(
            <div ref={menuPortalRef} className={styles.menu} style={{ top: menuPosition?.top, left: menuPosition?.left }}>
              <button className={styles.menuItem} onClick={() => { handleShare(); closeMenu() }}>
                <Share2 size={13} /> Partilhar
              </button>
              <button className={styles.menuItem} onClick={() => { handleShare(); closeMenu() }}>
                <Copy size={13} /> Copiar link
              </button>
              <button className={styles.menuItem} onClick={handleOpenReport}>Denunciar</button>
              {onDelete && (
                <button
                  className={`${styles.menuItem} ${styles.menuDanger}`}
                  onClick={() => { onDelete(post.id); closeMenu() }}
                >
                  <Trash2 size={13} /> Apagar post
                </button>
              )}
            </div>,
            document.body
          )}
        </div>
      </div>

       <div className={styles.body}>
        {isSpoiler && !spoilerRevealed && (
          <button
            type="button"
            className={styles.spoiler}
            onClick={() => setSpoilerRevealed(true)}
            title="Clique para revelar"
          >
            <AlertTriangle size={16} />
            Este post está marcado como spoiler. Clique para revelar.
          </button>
        )}

        {canReveal && (
          <>
            {isSensitive && !sensitiveRevealed && (
              <button
                type="button"
                className={styles.sensitive}
                onClick={() => setSensitiveRevealed(true)}
                title="Clique para revelar"
              >
                <AlertTriangle size={16} />
                Este conteúdo é sensível. Clique para revelar.
              </button>
            )}

            {canRevealSensitive && (
              <>
                <p className={styles.text}>{post.content}</p>
                {post.image_url && (
                  <img src={post.image_url} alt="Imagem do post" className={styles.postImage} />
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${post.liked_by_me ? styles.liked : ''}`}
          onClick={() => {
            if (requireLogin({
              title: 'Like protegido',
              message: 'Entra na tua conta para guardar gostos e interagir com publicacoes.',
            })) {
              onLike?.(post.id)
            }
          }}
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

      {commentsOpen && (
        <div className={styles.commentsSection}>
          {loadingComments && (
            <div className={styles.commentsLoading}>
              <Loader2 size={16} className="spin" />
            </div>
          )}

          {!loadingComments && comments.length === 0 && (
            <p className={styles.commentsEmpty}>Ainda não há comentários. Sê o primeiro!</p>
          )}

          {comments.map(c => (
            <div key={c.id}>
              <CommentItem
                comment={c}
                myId={myId}
                myRole={myRole}
                onDelete={handleDeleteComment}
                onEdit={handleEditComment}
                onLike={handleLikeComment}
                onReply={handleReply}
                loadingReplies={loadingReplies}
                onLoadReplies={handleLoadReplies}
              />
              {replies[c.id]?.map(r => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  myId={myId}
                  myRole={myRole}
                  onDelete={handleDeleteComment}
                  onEdit={handleEditComment}
                  onLike={handleLikeComment}
                  onReply={handleReply}
                  loadingReplies={false}
                  onLoadReplies={() => {}}
                  depth={1}
                />
              ))}
            </div>
          ))}

          <div className={styles.commentInputRow}>
            <div className={styles.commentAvatar}>
              {myInitials}
            </div>
            <div className={styles.commentInputWrap}>
              {replyingToComment && replyingToComment.author && (
                <div className={styles.replyingToBar}>
                  <span>A responder a @{replyingToComment.author.username}</span>
                  <button onClick={() => { setReplyingTo(null); setCommentText('') }}><X size={12} /></button>
                </div>
              )}
              <input
                className={styles.commentField}
                placeholder={replyingTo && replyingToComment?.author ? `Responder a ${replyingToComment.author.username}...` : 'Adicionar um comentário...'}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onFocus={() => {
                  if (isGuest) {
                    requestLogin({
                      title: 'Comentario protegido',
                      message: 'Entra na tua conta para comentar publicacoes.',
                    })
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
                maxLength={500}
              />
            </div>
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

      {reportModalOpen && typeof document !== 'undefined' && createPortal(
        <div ref={reportModalRef} className={styles.reportModalOverlay} onClick={() => setReportModalOpen(false)}>
          <div className={styles.reportModal} onClick={e => e.stopPropagation()}>
            <div className={styles.reportModalHeader}>
              <h3>Denunciar publicação</h3>
              <button className={styles.reportModalClose} onClick={() => setReportModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.reportReasons}>
              {[
                { value: 'spam', label: 'Spam' },
                { value: 'explicit', label: 'Conteúdo explícito' },
                { value: 'harassment', label: 'Assédio' },
                { value: 'other', label: 'Outro' },
              ].map(r => (
                <button
                  key={r.value}
                  className={`${styles.reportReasonBtn} ${reportReason === r.value ? styles.reportReasonBtnActive : ''}`}
                  onClick={() => setReportReason(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {reportReason && (
              <textarea
                className={styles.reportDescription}
                placeholder="Descreve o motivo da denúncia (opcional)"
                value={reportDescription}
                onChange={e => setReportDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            )}

            <div className={styles.reportModalActions}>
              <button className={styles.reportCancelBtn} onClick={() => setReportModalOpen(false)}>
                Cancelar
              </button>
              <button
                className={styles.reportSubmitBtn}
                onClick={handleSubmitReport}
                disabled={!reportReason || reportSubmitting}
              >
                {reportSubmitting ? <Loader2 size={14} className="spin" /> : 'Enviar denúncia'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showReportSuccess && typeof document !== 'undefined' && createPortal(
        <div ref={reportSuccessRef} className={styles.reportModalOverlay} onClick={() => setShowReportSuccess(false)}>
          <div className={styles.reportResultModal} onClick={e => e.stopPropagation()}>
            <div className={styles.reportResultIcon}>
              <Check size={32} color="var(--green)" />
            </div>
            <h3>Denúncia enviada</h3>
            <p>A tua denúncia foi registada com sucesso.</p>
            <button className={styles.reportResultBtn} onClick={() => setShowReportSuccess(false)}>OK</button>
          </div>
        </div>,
        document.body
      )}

      {showReportError && typeof document !== 'undefined' && createPortal(
        <div ref={reportErrorRef} className={styles.reportModalOverlay} onClick={() => setShowReportError(false)}>
          <div className={styles.reportResultModal} onClick={e => e.stopPropagation()}>
            <div className={styles.reportResultIcon}>
              <X size={32} color="var(--red)" />
            </div>
            <h3>Erro na denúncia</h3>
            <p>{reportError}</p>
            <button className={styles.reportResultBtn} onClick={() => setShowReportError(false)}>OK</button>
          </div>
        </div>,
        document.body
      )}
    </article>
  )
}
