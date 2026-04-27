'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { User, Save, ChevronRight, Loader2, AlertTriangle, X } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { getMyProfile, updateProfile } from '@/services/profile'
import { uploadImage } from '@/services/upload'
import styles from './page.module.css'

const SECTIONS = [
  { id: 'perfil',       label: 'Perfil',        icon: User    },
]

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }} onClick={onCancel}>
      <div style={{
        background: 'var(--bg2)', borderRadius: 'var(--radius-lg)',
        padding: 24, maxWidth: 360, width: '90%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(252,92,125,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={20} color="#f87171" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h3>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px 16px', borderRadius: 20,
            border: '1px solid var(--border)', background: 'var(--bg3)',
            color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px 16px', borderRadius: 20,
            border: '1px solid rgba(252,92,125,0.4)', background: '#f87171',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default function ConfigPage() {
  const { data: session } = useSession()
  const [active,  setActive]  = useState('perfil')
  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [profile, setProfile] = useState({
    display_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    avatar_url: null as string | null,
    avatar_initials: '',
  })

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Load real profile on mount
  useEffect(() => {
    getMyProfile().then(res => {
      if (res.data) {
        setProfile({
          display_name:    res.data.display_name,
          username:        res.data.username,
          bio:             res.data.bio ?? '',
          location:        res.data.location ?? '',
          website:         res.data.website ?? '',
          avatar_url:      res.data.avatar_url,
          avatar_initials: res.data.avatar_initials ?? '',
        })
      }
    }).catch(() => {
      // fallback to session data
      if (session?.user) {
        setProfile(p => ({
          ...p,
          display_name:    session.user.name ?? '',
          avatar_initials: session.user.avatar_initials ?? session.user.name?.slice(0, 2).toUpperCase() ?? '',
        }))
      }
    })
  }, [session])

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const url = await uploadImage(file, 'avatars')
      setProfile(p => ({ ...p, avatar_url: url }))
    } catch {
      setError('Erro ao carregar foto. Tente novamente.')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    if (saving) return
    setError(null)
    setSaving(true)
    try {
      const res = await updateProfile({
        display_name: profile.display_name.trim(),
        bio:          profile.bio,
        location:     profile.location,
        website:      profile.website,
        avatar_url:   profile.avatar_url ?? undefined,
      })
      if (res.error) throw new Error(res.error)
      if (res.data) {
        setProfile(p => ({
          ...p,
          display_name:    res.data?.display_name ?? p.display_name,
          bio:             res.data?.bio ?? '',
          location:        res.data?.location ?? '',
          website:        res.data?.website ?? '',
          avatar_url:     res.data?.avatar_url ?? p.avatar_url,
          avatar_initials: res.data?.avatar_initials ?? p.display_name.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase(),
        }))
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao guardar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccountClick = async () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false)
    setDeleting(true)

    try {
      const response = await fetch('/api/account', { method: 'DELETE' })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error || 'Não foi possível eliminar a conta.')
      }

      await signOut({ callbackUrl: '/login' })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao eliminar conta.')
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
  }

  const avatarDisplay = profile.avatar_url
    ? <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
    : profile.avatar_initials || profile.display_name.slice(0, 2).toUpperCase() || 'JA'

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
        </nav>

        {/* Content */}
        <div className={styles.content}>

          {/* ── Perfil ─────────────────────────────────── */}
          {active === 'perfil' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Perfil</h2>
              <p className={styles.sectionSub}>Informacoes visiveis para outros membros</p>

              <div className={styles.avatarSection}>
                <div className={styles.bigAvatar}>
                  {uploadingAvatar
                    ? <Loader2 size={24} className="spin" />
                    : avatarDisplay}
                </div>
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleAvatarPick}
                  />
                  <button
                    className={styles.changeAvatarBtn}
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? 'A carregar...' : 'Alterar foto'}
                  </button>
                  <p className={styles.avatarHint}>JPG, PNG ou WebP. Maximo 5 MB.</p>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Nome de display</label>
                  <input
                    className={styles.input}
                    value={profile.display_name}
                    onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                    maxLength={50}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Nome de utilizador</label>
                  <div className={styles.inputPrefix}>
                    <span>@</span>
                    <input
                      value={profile.username}
                      readOnly
                      title="O nome de utilizador nao pode ser alterado"
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Bio</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  maxLength={160}
                />
                <span className={styles.charCount}>{profile.bio.length}/160</span>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Localizacao</label>
                  <input
                    className={styles.input}
                    value={profile.location}
                    onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                    maxLength={80}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Website</label>
                  <input
                    className={styles.input}
                    value={profile.website}
                    onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                    maxLength={120}
                  />
                </div>
              </div>

              <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <p className={styles.sectionSub} style={{ marginBottom: 10, color: 'var(--red)' }}>
                  Zona de perigo
                </p>
                <button
                  className={styles.saveBtn}
                  onClick={handleDeleteAccountClick}
                  disabled={saving || uploadingAvatar || deleting}
                  style={{
                    background: 'rgba(252, 92, 125, 0.12)',
                    border: '1px solid rgba(252, 92, 125, 0.35)',
                    color: '#f87171',
                  }}
                >
                  {deleting ? <><Loader2 size={14} className="spin" /> A eliminar conta...</> : 'Eliminar conta permanentemente'}
                </button>
              </div>
            </div>
          )}

          {/* ── Save bar ───────────────────────────────── */}
          {error && <p className={styles.saveError}>{error}</p>}
          <div className={styles.saveBar}>
            <button
              className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`}
              onClick={handleSave}
              disabled={saving || uploadingAvatar}
            >
              {saving
                ? <><Loader2 size={14} className="spin" /> A guardar...</>
                : saved
                  ? <><span className={styles.checkmark}>✓</span> Guardado</>
                  : <><Save size={14} /> Guardar perfil</>
              }
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Eliminar conta"
        message="Tens a certeza que queres eliminar a tua conta permanentemente? Esta ação não pode ser desfeita."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}
