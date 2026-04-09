'use client'

import { useState } from 'react'
import { Pin, ExternalLink, Clock } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

const CATS = ['Tudo', 'Anime', 'Manga', 'Industria', 'Eventos', 'PORTAL']

const NEWS = [
  { id: '1', cat: 'Anime', catColor: 'var(--accent2)', title: 'Demon Slayer: Infinity Castle confirma data de estreia do segundo filme', summary: 'A Ufotable anunciou oficialmente que o segundo filme do arco Infinity Castle chegara aos cinemas japoneses em Outubro de 2026, com estreia global em Novembro. Os bilhetes para pre-venda ja estao disponiveis.', author: 'PortalAdmin', authorRole: 'superuser', time: 'Ha 1 hora', pinned: true, reads: '12.4k' },
  { id: '2', cat: 'Manga', catColor: 'var(--amber)', title: 'One Piece capitulo 1120: Oda revela detalhes do maior twist da saga', summary: 'O mais recente capitulo de One Piece trouxe uma revelacao que sacudiu toda a comunidade. Oda-sensei confirma teoria que circulava ha mais de cinco anos sobre a verdadeira natureza do Gear 5.', author: 'YukiSenpai', authorRole: 'mod', time: 'Ha 3 horas', pinned: false, reads: '8.7k' },
  { id: '3', cat: 'Industria', catColor: 'var(--green)', title: 'Crunchyroll anuncia parceria com studio MAPPA para exclusivos 2027', summary: 'A plataforma de streaming confirmou uma parceria de tres anos com o MAPPA, garantindo estreias exclusivas de pelo menos seis novos titulos por ano, incluindo sequelas de series muito aguardadas.', author: 'PortalAdmin', authorRole: 'superuser', time: 'Ha 5 horas', pinned: false, reads: '6.2k' },
  { id: '4', cat: 'PORTAL', catColor: 'var(--pink)', title: 'PORTAL ultrapassa 25.000 membros registados na primeira semana', summary: 'A nossa comunidade continua a crescer a um ritmo incrivel. Agradecemos a todos os otakus que se juntaram a nos nesta primeira semana de beta. Novidades grandes a caminho!', author: 'PortalAdmin', authorRole: 'superuser', time: 'Ha 1 dia', pinned: true, reads: '15.1k' },
  { id: '5', cat: 'Anime', catColor: 'var(--accent2)', title: 'Jujutsu Kaisen: Temporada 3 ganha trailer oficial com data de estreia', summary: 'A tao aguardada terceira temporada de JJK finalmente tem data confirmada: primavera de 2026. O trailer revelou a adaptacao do arco Culling Game com uma qualidade de animacao impressionante.', author: 'AkiraFan99', authorRole: null, time: 'Ha 2 dias', pinned: false, reads: '9.3k' },
  { id: '6', cat: 'Eventos', catColor: 'var(--red)', title: 'Lisboa Anime Fest 2026 divulga lineup completo de convidados', summary: 'O maior festival de cultura japonesa de Portugal revela os seus convidados especiais para a edicao de Abril, incluindo um voice actor de Demon Slayer e um cosplayer profissional internacionalmente reconhecido.', author: 'YukiSenpai', authorRole: 'mod', time: 'Ha 3 dias', pinned: false, reads: '4.8k' },
]

export default function NoticiasPage() {
  const [activeCat, setActiveCat] = useState('Tudo')

  const filtered = activeCat === 'Tudo' ? NEWS : NEWS.filter(n => n.cat === activeCat)
  const pinned = filtered.filter(n => n.pinned)
  const rest = filtered.filter(n => !n.pinned)

  return (
    <div className={styles.page}>
      <Topbar title="Noticias" />
      <div className={styles.body}>
        <div className={styles.mainCol}>
          <div className={styles.cats}>
            {CATS.map(c => (
              <button key={c} className={`${styles.catBtn} ${activeCat === c ? styles.catActive : ''}`} onClick={() => setActiveCat(c)}>{c}</button>
            ))}
          </div>

          {pinned.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}><Pin size={13} /> Fixadas</div>
              {pinned.map(n => <NewsCard key={n.id} item={n} />)}
            </div>
          )}

          <div className={styles.section}>
            {pinned.length > 0 && <div className={styles.sectionLabel}><Clock size={13} /> Recentes</div>}
            {rest.map(n => <NewsCard key={n.id} item={n} />)}
          </div>
        </div>

        <aside className={styles.rightPanel}>
          <p className={styles.panelTitle}>Mais lidas</p>
          {NEWS.sort((a, b) => parseInt(b.reads) - parseInt(a.reads)).slice(0, 5).map((n, i) => (
            <div key={n.id} className={styles.topItem}>
              <span className={styles.topRank}>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className={styles.topTitle}>{n.title}</div>
                <div className={styles.topMeta}>{n.reads} leituras</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}

function NewsCard({ item }: { item: typeof NEWS[0] }) {
  return (
    <article className={`${styles.newsCard} ${item.pinned ? styles.pinnedCard : ''}`}>
      {item.pinned && <div className={styles.pinnedTag}><Pin size={11} /> Fixada</div>}
      <div className={styles.newsMeta}>
        <span className={styles.newsCat} style={{ color: item.catColor }}>{item.cat}</span>
        <span className={styles.newsTime}>{item.time}</span>
        <span className={styles.newsReads}>{item.reads} leituras</span>
      </div>
      <h2 className={styles.newsTitle}>{item.title}</h2>
      <p className={styles.newsSummary}>{item.summary}</p>
      <div className={styles.newsFooter}>
        <div className={styles.newsAuthor}>
          Por <strong>{item.author}</strong>
          {item.authorRole === 'superuser' && <span className={styles.badgeSU}>Super User</span>}
          {item.authorRole === 'mod' && <span className={styles.badgeMod}>Mod</span>}
        </div>
        <button className={styles.readMore}>Ler mais <ExternalLink size={12} /></button>
      </div>
    </article>
  )
}
