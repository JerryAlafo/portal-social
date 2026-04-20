'use client'

import { AlertCircle, X } from 'lucide-react'
import styles from './FeatureUnavailableModal.module.css'

interface FeatureUnavailableModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  hint?: string
}

export default function FeatureUnavailableModal({
  open,
  onClose,
  title = 'Funcionalidade Indisponível',
  description = 'Esta funcionalidade ainda não está disponível nesta versão.',
  hint,
}: FeatureUnavailableModalProps) {
  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <div className={styles.icon}>
          <AlertCircle size={28} />
        </div>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
        {hint && <div className={styles.hint}>{hint}</div>}
        <button className={styles.button} onClick={onClose}>Entendi</button>
      </div>
    </div>
  )
}