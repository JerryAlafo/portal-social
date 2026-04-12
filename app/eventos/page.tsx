'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, Clock, ExternalLink } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  image_url: string
  organizer_id: string
  interested_count: number
  going_count: number
  date_color: string
  organizer?: {
    username: string
    role?: string
  }
}

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [interested, setInterested] = useState<Set<string>>(new Set())
  const [going, setGoing] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events')
        const data = await res.json()
        if (data.data) setEvents(data.data)
      } catch (err) {
        console.error('Erro ao carregar eventos:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const toggle = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setFn(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: date.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', ''),
      year: date.getFullYear()
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Topbar title="Eventos" />
        <div className={styles.body}>
          <div className={styles.mainCol}>
            <div className={styles.loading}>A carregar eventos...</div>
          </div>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className={styles.page}>
        <Topbar title="Eventos" />
        <div className={styles.body}>
          <div className={styles.mainCol}>
            <div className={styles.pageHeader}>
              <h2 className={styles.pageTitle}>Proximos eventos</h2>
              <p className={styles.pageSubtitle}>Eventos organizados por membros e pela equipa PORTAL</p>
            </div>
            <div className={styles.empty}>Ainda nao ha eventos publicados.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Topbar title="Eventos" />
      <div className={styles.body}>
        <div className={styles.mainCol}>
          <div className={styles.pageHeader}>
            <h2 className={styles.pageTitle}>Proximos eventos</h2>
            <p className={styles.pageSubtitle}>Eventos organizados por membros e pela equipa PORTAL</p>
          </div>

          {events.map(ev => {
            const date = formatDate(ev.date)
            const typeColor = ev.date_color || 'var(--pink)'

            return (
              <div key={ev.id} className={styles.eventCard}>
                <div className={styles.eventDateCol}>
                  <span className={styles.eventDay}>{date.day}</span>
                  <span className={styles.eventMonth}>{date.month}</span>
                  <span className={styles.eventYear}>{date.year}</span>
                </div>
                <div className={styles.eventContent}>
                  <div className={styles.eventMeta}>
                    <span className={styles.eventType} style={{ color: typeColor }}>
                      <MapPin size={11} />
                      {ev.location || 'A definir'}
                    </span>
                    <span className={styles.eventHost}>
                      Por <strong>{ev.organizer?.username || 'Portal'}</strong>
                      {ev.organizer?.role === 'superuser' && <span className={styles.badgeSU}>Super User</span>}
                      {ev.organizer?.role === 'mod' && <span className={styles.badgeMod}>Mod</span>}
                    </span>
                  </div>
                  <h3 className={styles.eventTitle}>{ev.title}</h3>
                  <p className={styles.eventDesc}>{ev.description}</p>
                  <div className={styles.eventFooter}>
                    <div className={styles.eventStats}>
                      <span><Users size={13} /> {ev.interested_count + (interested.has(ev.id) ? 1 : 0)} interessados</span>
                      <span>{ev.going_count + (going.has(ev.id) ? 1 : 0)} confirmados</span>
                    </div>
                    <div className={styles.eventBtns}>
                      <button
                        className={`${styles.intBtn} ${interested.has(ev.id) ? styles.intActive : ''}`}
                        onClick={() => toggle(interested, setInterested, ev.id)}
                      >
                        {interested.has(ev.id) ? 'Interessado' : 'Tenho interesse'}
                      </button>
                      <button
                        className={`${styles.goBtn} ${going.has(ev.id) ? styles.goActive : ''}`}
                        onClick={() => toggle(going, setGoing, ev.id)}
                      >
                        {going.has(ev.id) ? 'Vou' : 'Confirmar presenca'}
                      </button>
                      <button className={styles.shareBtn}><ExternalLink size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <aside className={styles.rightPanel}>
          <p className={styles.panelTitle}>Os meus eventos</p>
          <div className={styles.myEvents}>
            {events.filter(e => interested.has(e.id) || going.has(e.id)).map(e => (
              <div key={e.id} className={styles.myEventItem}>
                <span className={styles.myEventTitle}>{e.title}</span>
                <span className={styles.myEventDate}>{formatDate(e.date).day} {formatDate(e.date).month}</span>
                {going.has(e.id) && <span className={styles.goingBadge}>Confirmado</span>}
                {!going.has(e.id) && interested.has(e.id) && <span className={styles.intBadge}>Interessado</span>}
              </div>
            ))}
            {![...interested, ...going].length && (
              <p className={styles.emptyState}>Ainda nao confirmaste presenca em nenhum evento.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
