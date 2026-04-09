'use client'

import React from 'react'

import { useState } from 'react'
import { Calendar, MapPin, Users, Clock, ExternalLink } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

const EVENTS = [
  { id: '1', title: 'Viewing Party — Solo Leveling S2 Finale', date: '14 Abr 2026', time: '21:00', type: 'Online', typeColor: 'var(--accent2)', desc: 'Junta-te a nos para assistir ao episodio final da segunda temporada de Solo Leveling em conjunto. Hasnao, reacoes ao vivo e muito mais.', interested: 128, going: 64, host: 'PortalAdmin', hostRole: 'superuser' },
  { id: '2', title: 'Lisboa Anime Fest 2026', date: '20 Abr 2026', time: '10:00', type: 'Lisboa, PT', typeColor: 'var(--pink)', desc: 'O maior festival de cultura japonesa de Portugal. Dois dias de cosplay, merch, workshops, exibicoes e convidados especiais. Entrada gratuita para membros PORTAL com codigo exclusivo.', interested: 342, going: 187, host: 'YukiSenpai', hostRole: 'mod' },
  { id: '3', title: 'Torneio de Trivia — Anime Spring 2026', date: '28 Abr 2026', time: '19:00', type: 'Online', typeColor: 'var(--accent2)', desc: 'Desafia o teu conhecimento de anime da temporada de primavera 2026. Vencedor recebe badge exclusivo de "Otaku Supremo" no perfil do PORTAL.', interested: 89, going: 45, host: 'PortalAdmin', hostRole: 'superuser' },
  { id: '4', title: 'Workshop de Cosplay com SakuraHime', date: '5 Mai 2026', time: '15:00', type: 'Online', typeColor: 'var(--green)', desc: 'A cosplayer profissional SakuraHime ensina as tecnicas mais avancadas de construcao de props e confeccao de trajes. Vagas limitadas a 30 participantes.', interested: 203, going: 28, host: 'SakuraHime', hostRole: null },
  { id: '5', title: 'Porto Otaku Meeting — Maio 2026', date: '10 Mai 2026', time: '14:00', type: 'Porto, PT', typeColor: 'var(--amber)', desc: 'Encontro informal de otakus do norte de Portugal. Actividades, jogos de cartas, troca de manga e muito convivio na Livraria Lello.', interested: 67, going: 34, host: 'NaruZuki', hostRole: null },
]

export default function EventosPage() {
  const [interested, setInterested] = useState<Set<string>>(new Set(['1']))
  const [going, setGoing] = useState<Set<string>>(new Set())

  const toggle = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setFn(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
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

          {EVENTS.map(ev => (
            <div key={ev.id} className={styles.eventCard}>
              <div className={styles.eventDateCol}>
                <span className={styles.eventDay}>{ev.date.split(' ')[0]}</span>
                <span className={styles.eventMonth}>{ev.date.split(' ')[1]}</span>
                <span className={styles.eventYear}>{ev.date.split(' ')[2]}</span>
              </div>
              <div className={styles.eventContent}>
                <div className={styles.eventMeta}>
                  <span className={styles.eventType} style={{ color: ev.typeColor }}>
                    {ev.type.includes('PT') ? <MapPin size={11} /> : <Clock size={11} />}
                    {ev.type}
                  </span>
                  <span className={styles.eventTime}><Clock size={11} /> {ev.time}</span>
                  <span className={styles.eventHost}>
                    Por <strong>{ev.host}</strong>
                    {ev.hostRole === 'superuser' && <span className={styles.badgeSU}>Super User</span>}
                    {ev.hostRole === 'mod' && <span className={styles.badgeMod}>Mod</span>}
                  </span>
                </div>
                <h3 className={styles.eventTitle}>{ev.title}</h3>
                <p className={styles.eventDesc}>{ev.desc}</p>
                <div className={styles.eventFooter}>
                  <div className={styles.eventStats}>
                    <span><Users size={13} /> {ev.interested + (interested.has(ev.id) ? 1 : 0)} interessados</span>
                    <span>{ev.going + (going.has(ev.id) ? 1 : 0)} confirmados</span>
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
          ))}
        </div>

        <aside className={styles.rightPanel}>
          <p className={styles.panelTitle}>Os meus eventos</p>
          <div className={styles.myEvents}>
            {EVENTS.filter(e => interested.has(e.id) || going.has(e.id)).map(e => (
              <div key={e.id} className={styles.myEventItem}>
                <span className={styles.myEventTitle}>{e.title}</span>
                <span className={styles.myEventDate}>{e.date}</span>
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
