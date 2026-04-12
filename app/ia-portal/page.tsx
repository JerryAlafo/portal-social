'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, Bot, User, Sparkles } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const SUGGESTIONS = [
  'Que anime me recomendas para começar?',
  'Quais os melhores manga de 2026?',
  'Quando é o próximo anime festival em Portugal?',
  'Recomenda-me um isekai com romance',
]

export default function IAPortalPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/chat')
        const data = await res.json()
        if (data.data) setMessages(data.data)
      } catch (err) {
        console.error('Erro ao carregar histórico:', err)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sanitizeHTML = (text: string) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const sanitized = text.trim().replace(/<[^>]*>/g, '').slice(0, 2000)

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: sanitized,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sanitized,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      const data = await res.json()
      
      if (data.data) {
        const safeResponse: Message = {
          ...data.data,
          content: sanitizeHTML(data.data.content)
        }
        setMessages(prev => [...prev, safeResponse])
      } else {
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Desculpa, tive um problema ao processar a tua mensagem.',
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, errorMsg])
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearChat = async () => {
    try {
      await fetch('/api/chat', { method: 'DELETE' })
      setMessages([])
    } catch (err) {
      console.error('Erro ao limpar chat:', err)
    }
  }

  return (
    <div className={styles.page}>
      <Topbar title="IA Portal" />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.avatar}>
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className={styles.title}>PORTAL Bot</h1>
              <p className={styles.subtitle}>Especialista em anime e manga</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button className={styles.clearBtn} onClick={clearChat} title="Limpar conversa">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className={styles.chatArea}>
          {initialLoading ? (
            <div className={styles.loading}>
              <div className={styles.loadingDot}></div>
              <span>A carregar chat...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>
                <Bot size={48} />
              </div>
              <h2>Bem-vindo ao PORTAL Bot!</h2>
              <p>Sou especializado em anime, manga e cultura otaku. Pergunta-me o que quiseres!</p>
              
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className={styles.suggestionBtn} onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messages}>
              {messages.map(msg => (
                <div key={msg.id} className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.botMsg}`}>
                  <div className={styles.msgAvatar}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={styles.msgContent}>
                    <div className={styles.msgBubble}>
                      {msg.content}
                    </div>
                    <span className={styles.msgTime}>
                      {new Date(msg.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className={`${styles.message} ${styles.botMsg}`}>
                  <div className={styles.msgAvatar}>
                    <Bot size={16} />
                  </div>
                  <div className={styles.msgContent}>
                    <div className={styles.msgBubble}>
                      <span className={styles.typing}>
                        <span></span><span></span><span></span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className={styles.inputArea}>
          <input
            type="text"
            className={styles.input}
            placeholder="Pergunta-me sobre anime, manga..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            disabled={loading}
          />
          <button 
            className={styles.sendBtn} 
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
