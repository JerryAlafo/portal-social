'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Send, Phone, Video, MoreHorizontal, Smile, Paperclip, Check, CheckCheck, ArrowLeft } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

interface Message {
  id: string
  text: string
  time: string
  mine: boolean
  read: boolean
}

interface Conversation {
  id: string
  name: string
  handle: string
  initials: string
  bg: string
  color: string
  online: boolean
  lastMsg: string
  lastTime: string
  unread: number
  messages: Message[]
}

const CONVERSATIONS: Conversation[] = [
  {
    id: 'c1', name: 'YukiSenpai', handle: '@yukisenpai', initials: 'YS',
    bg: '#1a1000', color: '#fcb45c', online: true,
    lastMsg: 'Viste o ultimo episodio?', lastTime: '2 min', unread: 3,
    messages: [
      { id: 'm1', text: 'Ola! Viste o episodio desta semana de Demon Slayer?', time: '14:20', mine: false, read: true },
      { id: 'm2', text: 'Ainda nao, estou a guardar para ver com calma hoje a noite', time: '14:21', mine: true, read: true },
      { id: 'm3', text: 'Vai ser insano, juro. A animacao do Ufotable desta vez esta noutra dimensao', time: '14:22', mine: false, read: true },
      { id: 'm4', text: 'Agora fiquei com demasiada expectativa haha', time: '14:23', mine: true, read: true },
      { id: 'm5', text: 'Merece toda a hype, acredita. Depois dizes-me o que achaste!', time: '14:25', mine: false, read: true },
      { id: 'm6', text: 'Viste o ultimo episodio?', time: '14:50', mine: false, read: false },
    ],
  },
  {
    id: 'c2', name: 'AkiraFan99', handle: '@akirafan99', initials: 'AK',
    bg: '#0a2015', color: '#5cfcb4', online: true,
    lastMsg: 'Obrigado pela recomendacao!', lastTime: '1h', unread: 0,
    messages: [
      { id: 'm1', text: 'Ja viste Frieren? Deves adorar', time: '12:00', mine: true, read: true },
      { id: 'm2', text: 'Acabei agora mesmo os 28 episodios de uma assentada', time: '13:30', mine: false, read: true },
      { id: 'm3', text: 'E?!', time: '13:31', mine: true, read: true },
      { id: 'm4', text: 'Obrigado pela recomendacao!', time: '13:32', mine: false, read: true },
    ],
  },
  {
    id: 'c3', name: 'SakuraHime', handle: '@sakurahime', initials: 'SH',
    bg: '#1a0010', color: '#fc5c7d', online: false,
    lastMsg: 'Quando e o proximo evento?', lastTime: '3h', unread: 1,
    messages: [
      { id: 'm1', text: 'Ola! Vi o teu cosplay da Nezuko, ficou incrivel', time: '10:00', mine: true, read: true },
      { id: 'm2', text: 'Obrigada!! Levei muito tempo mas valeu a pena', time: '10:05', mine: false, read: true },
      { id: 'm3', text: 'Quando e o proximo evento?', time: '10:06', mine: false, read: false },
    ],
  },
  {
    id: 'c4', name: 'NaruZuki', handle: '@naruzuki', initials: 'NZ',
    bg: '#0a0a2a', color: '#7c5cfc', online: false,
    lastMsg: 'Boa noite!', lastTime: 'Ontem', unread: 0,
    messages: [
      { id: 'm1', text: 'Boa noite!', time: 'Ontem', mine: false, read: true },
    ],
  },
  {
    id: 'c5', name: 'OtakuRei', handle: '@otakulei', initials: 'OR',
    bg: '#1a0030', color: '#e879f9', online: true,
    lastMsg: 'Tens de ver Blue Lock!', lastTime: '2 dias', unread: 0,
    messages: [
      { id: 'm1', text: 'Tens de ver Blue Lock!', time: '2 dias', mine: false, read: true },
    ],
  },
]

export default function MensagensPage() {
  const [activeId, setActiveId] = useState('c1')
  const [convos, setConvos] = useState(CONVERSATIONS)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const active = convos.find(c => c.id === activeId)!

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeId, active?.messages.length])

  const selectConvo = (id: string) => {
    setActiveId(id)
    setChatOpen(true)
    setConvos(prev => prev.map(c =>
      c.id === id ? { ...c, unread: 0 } : c
    ))
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return
    const newMsg: Message = {
      id: Date.now().toString(),
      text,
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      mine: true,
      read: false,
    }
    setConvos(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: [...c.messages, newMsg], lastMsg: text, lastTime: 'Agora' }
        : c
    ))
    setInput('')
  }

  const filtered = convos.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.handle.toLowerCase().includes(search.toLowerCase())
  )

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
          <div className={styles.convList}>
            {filtered.map(c => (
              <div
                key={c.id}
                className={`${styles.convItem} ${c.id === activeId ? styles.convActive : ''}`}
                onClick={() => selectConvo(c.id)}
              >
                <div className={styles.convAvatarWrap}>
                  <div className={styles.convAvatar} style={{ background: c.bg, color: c.color }}>
                    {c.initials}
                  </div>
                  {c.online && <span className={styles.onlineDot} />}
                </div>
                <div className={styles.convInfo}>
                  <div className={styles.convTop}>
                    <span className={styles.convName}>{c.name}</span>
                    <span className={styles.convTime}>{c.lastTime}</span>
                  </div>
                  <div className={styles.convBottom}>
                    <span className={styles.convLast}>{c.lastMsg}</span>
                    {c.unread > 0 && <span className={styles.unreadBadge}>{c.unread}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className={`${styles.chatWindow} ${chatOpen ? styles.chatVisible : ''}`}>
          {/* Chat header */}
          <div className={styles.chatHeader}>
            <button className={styles.backBtn} onClick={() => setChatOpen(false)} aria-label="Voltar">
              <ArrowLeft size={18} />
            </button>
            <div className={styles.chatAvatarWrap}>
              <div className={styles.chatAvatar} style={{ background: active.bg, color: active.color }}>
                {active.initials}
              </div>
              {active.online && <span className={styles.onlineDot} />}
            </div>
            <div className={styles.chatHeaderInfo}>
              <span className={styles.chatName}>{active.name}</span>
              <span className={styles.chatStatus}>{active.online ? 'Online agora' : 'Offline'}</span>
            </div>
            <div className={styles.chatHeaderActions}>
              <button className={styles.headerBtn}><Phone size={16} /></button>
              <button className={styles.headerBtn}><Video size={16} /></button>
              <button className={styles.headerBtn}><MoreHorizontal size={16} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {active.messages.map((msg, i) => {
              const showDate = i === 0 || active.messages[i-1].time !== msg.time
              return (
                <div key={msg.id}>
                  {i === 0 && (
                    <div className={styles.dateDivider}>Hoje</div>
                  )}
                  <div className={`${styles.msgRow} ${msg.mine ? styles.msgMine : ''}`}>
                    {!msg.mine && (
                      <div className={styles.msgAvatar} style={{ background: active.bg, color: active.color }}>
                        {active.initials}
                      </div>
                    )}
                    <div className={styles.msgBubble}>
                      <p className={styles.msgText}>{msg.text}</p>
                      <div className={styles.msgMeta}>
                        <span className={styles.msgTime}>{msg.time}</span>
                        {msg.mine && (
                          msg.read
                            ? <CheckCheck size={12} color="var(--accent2)" />
                            : <Check size={12} color="var(--text3)" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <button className={styles.inputBtn}><Paperclip size={16} /></button>
            <input
              className={styles.msgInput}
              type="text"
              placeholder={`Mensagem para ${active.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button className={styles.inputBtn}><Smile size={16} /></button>
            <button
              className={`${styles.sendBtn} ${input.trim() ? styles.sendActive : ''}`}
              onClick={sendMessage}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
