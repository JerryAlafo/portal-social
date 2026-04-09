'use client'

import { useState } from 'react'
import { User, Bell, Shield, Palette, Eye, Trash2, Save, ChevronRight } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import styles from './page.module.css'

const SECTIONS = [
  { id: 'perfil',         label: 'Perfil',           icon: User },
  { id: 'notificacoes',   label: 'Notificacoes',      icon: Bell },
  { id: 'privacidade',    label: 'Privacidade',       icon: Shield },
  { id: 'aparencia',      label: 'Aparencia',         icon: Palette },
  { id: 'conta',          label: 'Conta',             icon: Eye },
]

export default function ConfigPage() {
  const [active, setActive] = useState('perfil')
  const [saved, setSaved] = useState(false)

  const [profile, setProfile] = useState({ name: 'Jerry Otaku', handle: 'jalafo', bio: 'Otaku de coracao. Apaixonado por anime desde os 8 anos.', location: 'Lisboa, Portugal', website: 'myanimelist.net/jalafo' })
  const [notifs, setNotifs] = useState({ likes: true, comments: true, follows: true, mentions: true, events: false, newsletter: false })
  const [privacy, setPrivacy] = useState({ publicProfile: true, showFollowers: true, allowMessages: 'all', showOnline: true })
  const [appearance, setAppearance] = useState({ theme: 'dark', fontSize: 'medium', compactMode: false, animations: true })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className={styles.page}>
      <Topbar title="Configuracoes" />
      <div className={styles.body}>

        {/* Nav */}
        <nav className={styles.nav}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`${styles.navItem} ${active === s.id ? styles.navActive : ''}`}
              onClick={() => setActive(s.id)}
            >
              <s.icon size={16} />
              {s.label}
              <ChevronRight size={14} className={styles.navChevron} />
            </button>
          ))}
          <div className={styles.navDivider} />
          <button className={styles.navItem} style={{ color: 'var(--red)' }}>
            <Trash2 size={16} />
            Eliminar conta
          </button>
        </nav>

        {/* Content */}
        <div className={styles.content}>
          {active === 'perfil' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Perfil</h2>
              <p className={styles.sectionSub}>Informacoes visiveis para outros membros</p>

              <div className={styles.avatarSection}>
                <div className={styles.bigAvatar}>JA</div>
                <div>
                  <button className={styles.changeAvatarBtn}>Alterar foto</button>
                  <p className={styles.avatarHint}>JPG, PNG ou GIF. Maximo 5 MB.</p>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Nome de display</label>
                  <input className={styles.input} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Nome de utilizador</label>
                  <div className={styles.inputPrefix}><span>@</span><input value={profile.handle} onChange={e => setProfile(p => ({ ...p, handle: e.target.value }))} /></div>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Bio</label>
                <textarea className={styles.textarea} rows={3} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                <span className={styles.charCount}>{profile.bio.length}/160</span>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Localizacao</label>
                  <input className={styles.input} value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Website</label>
                  <input className={styles.input} value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {active === 'notificacoes' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Notificacoes</h2>
              <p className={styles.sectionSub}>Escolhe quando e como queres ser notificado</p>
              <div className={styles.toggleList}>
                {([
                  { key: 'likes', label: 'Gostos nas publicacoes', sub: 'Quando alguem gostar de uma publicacao tua' },
                  { key: 'comments', label: 'Comentarios', sub: 'Quando alguem comentar nas tuas publicacoes' },
                  { key: 'follows', label: 'Novos seguidores', sub: 'Quando alguem te comecar a seguir' },
                  { key: 'mentions', label: 'Mencoes', sub: 'Quando fores mencionado numa publicacao' },
                  { key: 'events', label: 'Eventos', sub: 'Actualizacoes sobre eventos que marcaste interesse' },
                  { key: 'newsletter', label: 'Newsletter PORTAL', sub: 'Resumo semanal de novidades da comunidade' },
                ] as const).map(item => (
                  <div key={item.key} className={styles.toggleItem}>
                    <div>
                      <div className={styles.toggleLabel}>{item.label}</div>
                      <div className={styles.toggleSub}>{item.sub}</div>
                    </div>
                    <button
                      className={`${styles.toggle} ${notifs[item.key] ? styles.toggleOn : ''}`}
                      onClick={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key] }))}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'privacidade' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Privacidade</h2>
              <p className={styles.sectionSub}>Controla quem pode ver o teu conteudo</p>
              <div className={styles.toggleList}>
                {([
                  { key: 'publicProfile', label: 'Perfil publico', sub: 'Qualquer pessoa pode ver o teu perfil' },
                  { key: 'showFollowers', label: 'Mostrar seguidores', sub: 'Outros membros podem ver quem te segue' },
                  { key: 'showOnline', label: 'Mostrar estado online', sub: 'Outros membros podem ver quando estas online' },
                ] as const).map(item => (
                  <div key={item.key} className={styles.toggleItem}>
                    <div>
                      <div className={styles.toggleLabel}>{item.label}</div>
                      <div className={styles.toggleSub}>{item.sub}</div>
                    </div>
                    <button
                      className={`${styles.toggle} ${privacy[item.key] ? styles.toggleOn : ''}`}
                      onClick={() => setPrivacy(p => ({ ...p, [item.key]: !p[item.key] }))}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.field} style={{ marginTop: 20 }}>
                <label className={styles.label}>Quem pode enviar mensagens</label>
                <select className={styles.select} value={privacy.allowMessages} onChange={e => setPrivacy(p => ({ ...p, allowMessages: e.target.value }))}>
                  <option value="all">Todos os membros</option>
                  <option value="followers">Apenas seguidores</option>
                  <option value="none">Ninguem</option>
                </select>
              </div>
            </div>
          )}

          {active === 'aparencia' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Aparencia</h2>
              <p className={styles.sectionSub}>Personaliza o aspecto visual do PORTAL</p>
              <div className={styles.field}>
                <label className={styles.label}>Tema</label>
                <div className={styles.themeOptions}>
                  {(['dark', 'light'] as const).map(t => (
                    <button
                      key={t}
                      className={`${styles.themeOption} ${appearance.theme === t ? styles.themeActive : ''}`}
                      onClick={() => setAppearance(a => ({ ...a, theme: t }))}
                    >
                      <div className={`${styles.themePreview} ${styles[`preview_${t}`]}`} />
                      {t === 'dark' ? 'Escuro' : 'Claro'}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tamanho do texto</label>
                <div className={styles.sizeOptions}>
                  {(['small', 'medium', 'large'] as const).map(s => (
                    <button key={s} className={`${styles.sizeBtn} ${appearance.fontSize === s ? styles.sizeActive : ''}`} onClick={() => setAppearance(a => ({ ...a, fontSize: s }))}>
                      {s === 'small' ? 'Pequeno' : s === 'medium' ? 'Normal' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.toggleList}>
                {([
                  { key: 'compactMode', label: 'Modo compacto', sub: 'Reduz o espacamento entre elementos' },
                  { key: 'animations', label: 'Animacoes', sub: 'Activa transicoes e efeitos visuais' },
                ] as const).map(item => (
                  <div key={item.key} className={styles.toggleItem}>
                    <div>
                      <div className={styles.toggleLabel}>{item.label}</div>
                      <div className={styles.toggleSub}>{item.sub}</div>
                    </div>
                    <button
                      className={`${styles.toggle} ${appearance[item.key] ? styles.toggleOn : ''}`}
                      onClick={() => setAppearance(a => ({ ...a, [item.key]: !a[item.key] }))}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'conta' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Conta</h2>
              <p className={styles.sectionSub}>Gerir credenciais e seguranca</p>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} type="email" defaultValue="jerry@portal.pt" />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Password actual</label>
                  <input className={styles.input} type="password" placeholder="••••••••" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Nova password</label>
                  <input className={styles.input} type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className={styles.dangerZone}>
                <h3 className={styles.dangerTitle}>Zona de perigo</h3>
                <div className={styles.dangerItem}>
                  <div>
                    <div className={styles.dangerLabel}>Desactivar conta temporariamente</div>
                    <div className={styles.dangerSub}>O teu perfil ficara oculto ate reactivares</div>
                  </div>
                  <button className={styles.dangerBtn}>Desactivar</button>
                </div>
                <div className={styles.dangerItem}>
                  <div>
                    <div className={styles.dangerLabel}>Eliminar conta permanentemente</div>
                    <div className={styles.dangerSub}>Esta accao e irreversivel. Todos os dados serao apagados.</div>
                  </div>
                  <button className={`${styles.dangerBtn} ${styles.dangerBtnRed}`}>Eliminar</button>
                </div>
              </div>
            </div>
          )}

          {/* Save bar */}
          <div className={styles.saveBar}>
            <button className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`} onClick={handleSave}>
              {saved ? <><span className={styles.checkmark}>✓</span> Guardado</> : <><Save size={14} /> Guardar alteracoes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
