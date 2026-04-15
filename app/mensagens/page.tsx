'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Search, Send, Phone, Video, MoreHorizontal, Smile, Paperclip, Check, CheckCheck, ArrowLeft, Loader } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { getConversations, getMessages, sendMessage } from '@/services/messages'
import FeatureUnavailableModal from '@/components/ui/FeatureUnavailableModal'
import type { Conversation, Message } from '@/types'
import styles from './page.module.css'

const QUICK_EMOJIS = ['😀', '😂', '🔥', '❤️', '👏', '🙌', '✨', '🤝']

function MensagensContent() {
  const searchParams = useSearchParams()
  const userParam = searchParams.get('user')
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const msgInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [initUserId, setInitUserId] = useState<string | null>(null)
  const [showNotAvailable, setShowNotAvailable] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [openingConv, setOpeningConv] = useState(false)

  // Load conversations
  useEffect(() => {
    const loadConversations = () => {
      getConversations()
        .then(res => { if (res.data) setConversations(res.data) })
        .catch(() => {})
        .finally(() => setLoadingConvs(false))
    }
    loadConversations()
    const interval = setInterval(loadConversations, 10000)
    return () => clearInterval(interval)
  }, [])

  // Handle user param for opening conversation
  useEffect(() => {
    if (userParam && !initUserId) {
      setInitUserId(userParam)
      setOpeningConv(true)
      const openConversation = async () => {
        try {
          const res = await fetch(`/api/conversations/get-or-create?user_id=${userParam}`)
          const data = await res.json()
          if (data.data) {
            setActiveConv(data.data)
            setChatOpen(true)
            // Add to conversations if not exists
            setConversations(prev => {
              const exists = prev.find(c => c.id === data.data.id)
              if (!exists) {
                return [data.data, ...prev]
              }
              return prev
            })
            // Load messages
            const msgRes = await getMessages(data.data.id)
            if (msgRes.data) setMessages(msgRes.data)
          }
        } catch (e) {
          console.error(e)
        } finally {
          setOpeningConv(false)
        }
      }
      openConversation()
    }
  }, [userParam, initUserId])

  // Load messages when conversation changes
  const loadMessages = useCallback(async (conv: Conversation) => {
    setLoadingMsgs(true)
    try {
      const res = await getMessages(conv.id)
      if (res.data) setMessages(res.data)
      
      // Mark messages as read via API
      await fetch(`/api/conversations/${conv.id}/messages/read`, { method: 'POST' })
      
      // Mark as read locally
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
      )
    } catch {
      setMessages([])
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read when conversation is open
  useEffect(() => {
    if (activeConv && chatOpen) {
      const timer = setTimeout(async () => {
        try {
          await fetch(`/api/conversations/${activeConv.id}/messages/read`, { method: 'POST' })
          setConversations(prev =>
            prev.map(c => c.id === activeConv.id ? { ...c, unread_count: 0 } : c)
          )
        } catch { /* ignore */ }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [activeConv, chatOpen])

  const selectConvo = async (conv: Conversation) => {
    setActiveConv(conv)
    setChatOpen(true)
    await loadMessages(conv)
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !activeConv || sending) return
    setSending(true)

    // Optimistic message
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversation_id: activeConv.id,
      sender_id: session?.user?.id ?? '',
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')

    try {
      const res = await sendMessage(activeConv.id, text)
      if (res.data) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? res.data! : m))
      }
      // Update last message in conversation list
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConv.id
            ? { ...c, last_message: { content: text, created_at: optimistic.created_at, sender_id: optimistic.sender_id } }
            : c
        )
      )
    } catch {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const handleAttachClick = () => {
    attachmentInputRef.current?.click()
  }

  const handleAttachPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setInput((prev) => `${prev}${prev ? ' ' : ''}[Anexo: ${file.name}]`)
    e.target.value = ''
    msgInputRef.current?.focus()
  }

  const handleAddEmoji = (emoji: string) => {
    setInput((prev) => `${prev}${emoji}`)
    setShowEmojiPicker(false)
    msgInputRef.current?.focus()
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  }

  const formatConvTime = (dateStr: string | undefined) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'Agora'
    if (mins < 60) return `${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h`
    return 'Ontem'
  }

  const filtered = conversations.filter(c =>
    c.other_user.display_name.toLowerCase().includes(search.toLowerCase()) ||
    c.other_user.username.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)

  const myId = session?.user?.id

  return (
    <div className={styles.page}>
      <Topbar title="Mensagens" />
      <div className={styles.body}>

        {/* Conversations list */}
        <div className={`${styles.sidebar} ${chatOpen ? styles.sidebarHidden : ''}`}>
          <div className={styles.sidebarSearch}>
            <Search size={14} color="var(--text3)" />
            <input
              type="text"
              placeholder="Pesquisar mensagens..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {totalUnread > 0 && (
            <div className={styles.unreadHeader}>
              <span>{totalUnread} mensagem{totalUnread > 1 ? 'ns' : ''} não lida{totalUnread > 1 ? 's' : ''}</span>
            </div>
          )}

          <div className={styles.convList}>
            {loadingConvs ? (
              <div className={styles.listLoading}><Loader size={20} /></div>
            ) : filtered.length === 0 ? (
              <p className={styles.listEmpty}>Nenhuma conversa ainda.</p>
            ) : filtered.map(c => (
              <div
                key={c.id}
                className={`${styles.convItem} ${activeConv?.id === c.id ? styles.convActive : ''}`}
                onClick={() => selectConvo(c)}
              >
                <div className={styles.convAvatarWrap}>
                  <div className={styles.convAvatar} style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                    {c.other_user.avatar_url
                      ? <img src={c.other_user.avatar_url} alt={c.other_user.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : c.other_user.avatar_initials}
                  </div>
                  {c.other_user.is_online && <span className={styles.onlineDot} />}
                </div>
                <div className={styles.convInfo}>
                  <div className={styles.convTop}>
                    <span className={styles.convName}>{c.other_user.display_name}</span>
                    <span className={styles.convTime}>{formatConvTime(c.last_message?.created_at)}</span>
                  </div>
                  <div className={styles.convBottom}>
                    <span className={styles.convLast}>{c.last_message?.content ?? 'Sem mensagens ainda'}</span>
                    {c.unread_count > 0 && <span className={styles.unreadBadge}>{c.unread_count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className={`${styles.chatWindow} ${chatOpen ? styles.chatVisible : ''}`}>
          {openingConv ? (
            <div className={styles.noChat}>
              <Loader size={24} className="spin" />
              <p>Abrir conversa...</p>
            </div>
          ) : !activeConv ? (
            <div className={styles.noChat}>
              <p>Seleciona uma conversa para começar.</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className={styles.chatHeader}>
                <button className={styles.backBtn} onClick={() => setChatOpen(false)} aria-label="Voltar">
                  <ArrowLeft size={18} />
                </button>
                <div className={styles.chatAvatarWrap}>
                  <div className={styles.chatAvatar} style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                    {activeConv.other_user.avatar_url
                      ? <img src={activeConv.other_user.avatar_url} alt={activeConv.other_user.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : activeConv.other_user.avatar_initials}
                  </div>
                  {activeConv.other_user.is_online && <span className={styles.onlineDot} />}
                </div>
                <div className={styles.chatHeaderInfo}>
                  <span className={styles.chatName}>{activeConv.other_user.display_name}</span>
                  <span className={styles.chatStatus}>{activeConv.other_user.is_online ? 'Online agora' : 'Offline'}</span>
                </div>
                <div className={styles.chatHeaderActions}>
                  <button className={styles.headerBtn} onClick={() => setShowNotAvailable(true)}><Phone size={16} /></button>
                  <button className={styles.headerBtn} onClick={() => setShowNotAvailable(true)}><Video size={16} /></button>
                  <button className={styles.headerBtn} onClick={() => setShowNotAvailable(true)}><MoreHorizontal size={16} /></button>
                </div>
              </div>

              {/* Messages */}
              <div className={styles.messages}>
                {loadingMsgs ? (
                  <div className={styles.msgsLoading}><Loader size={20} /></div>
                ) : (
                  <>
                    <div className={styles.dateDivider}>Hoje</div>
                    {messages.map(msg => {
                      const isMine = msg.sender_id === myId
                      return (
                        <div key={msg.id} className={`${styles.msgRow} ${isMine ? styles.msgMine : ''}`}>
                          {!isMine && (
                          <div className={styles.msgAvatar} style={{ background: 'var(--bg4)', color: 'var(--accent2)' }}>
                            {activeConv.other_user.avatar_url
                              ? <img src={activeConv.other_user.avatar_url} alt={activeConv.other_user.display_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              : activeConv.other_user.avatar_initials}
                          </div>
                          )}
                          <div className={styles.msgBubble}>
                            <p className={styles.msgText}>{msg.content}</p>
                            <div className={styles.msgMeta}>
                              <span className={styles.msgTime}>{formatTime(msg.created_at)}</span>
                              {isMine && (
                                msg.is_read
                                  ? <CheckCheck size={12} color="var(--accent2)" />
                                  : <Check size={12} color="var(--text3)" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className={styles.inputArea}>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleAttachPick}
                />
                <button className={styles.inputBtn} onClick={handleAttachClick} aria-label="Anexar ficheiro">
                  <Paperclip size={16} />
                </button>
                <input
                  ref={msgInputRef}
                  className={styles.msgInput}
                  type="text"
                  placeholder={`Mensagem para ${activeConv.other_user.display_name}...`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <div className={styles.emojiWrap}>
                  <button
                    className={styles.inputBtn}
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    aria-label="Abrir emojis"
                  >
                    <Smile size={16} />
                  </button>
                  {showEmojiPicker && (
                    <div className={styles.emojiPicker}>
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          className={styles.emojiBtn}
                          onClick={() => handleAddEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className={`${styles.sendBtn} ${input.trim() ? styles.sendActive : ''}`}
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? <Loader size={15} /> : <Send size={15} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <FeatureUnavailableModal
        open={showNotAvailable}
        onClose={() => setShowNotAvailable(false)}
        hint="Em breve poderás fazer chamadas de voz e vídeo com os teus amigos."
      />
    </div>
  )
}

export default function MensagensPage() {
  return (
    <Suspense fallback={<div className={styles.page}><Topbar title="Mensagens" /><div className={styles.body}><div className={styles.sidebar}><div className={styles.listLoading}><Loader size={20} /></div></div><div className={styles.chatWindow}><div className={styles.noChat}><p>Carregando...</p></div></div></div></div>}>
      <MensagensContent />
    </Suspense>
  )
}
