'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import PostCard from '@/components/posts/PostCard'
import { mockPosts } from '@/lib/mock-data'
import styles from './page.module.css'

const FOLLOWING = [
  { name: 'YukiSenpai', initials: 'YS', bg: '#1a1000', color: '#fcb45c', online: true },
  { name: 'AkiraFan99', initials: 'AK', bg: '#0a2015', color: '#5cfcb4', online: true },
  { name: 'SakuraHime', initials: 'SH', bg: '#1a0010', color: '#fc5c7d', online: false },
  { name: 'NaruZuki',   initials: 'NZ', bg: '#0a0a2a', color: '#7c5cfc', online: false },
  { name: 'OtakuRei',   initials: 'OR', bg: '#1a0030', color: '#e879f9', online: true },
]

export default function SeguindoPage() {
  const feed = mockPosts.filter(p => !p.isPinned)

  return (
    <div className={styles.page}>
      <Topbar title="A Seguir" />
      <div className={styles.body}>
        <div className={styles.feedCol}>
          {/* Online bubbles */}
          <div className={styles.onlineBar}>
            <span className={styles.onlineLabel}>Online agora</span>
            <div className={styles.onlineList}>
              {FOLLOWING.filter(f => f.online).map(f => (
                <div key={f.name} className={styles.onlineBubble}>
                  <div className={styles.onlineAvatar} style={{ background: f.bg, color: f.color }}>{f.initials}</div>
                  <div className={styles.onlineDot} />
                  <span className={styles.onlineName}>{f.name}</span>
                </div>
              ))}
            </div>
          </div>

          <p className={styles.feedLabel}>Publicacoes recentes de quem segues</p>

          <div className={styles.posts}>
            {feed.map((p, i) => (
              <div key={p.id} className={`animate-fade-in-up animate-delay-${Math.min(i+1,4)}`}>
                <PostCard post={p} />
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.rightPanel}>
          <p className={styles.panelTitle}>A seguir ({FOLLOWING.length})</p>
          {FOLLOWING.map(f => (
            <div key={f.name} className={styles.followItem}>
              <div className={styles.followAvatarWrap}>
                <div className={styles.followAvatar} style={{ background: f.bg, color: f.color }}>{f.initials}</div>
                {f.online && <span className={styles.onlineDotSmall} />}
              </div>
              <span className={styles.followName}>{f.name}</span>
              <button className={styles.unfollowBtn}>Deixar de seguir</button>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
