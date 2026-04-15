'use client'

import { AlertCircle, X } from 'lucide-react'

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <AlertCircle size={20} color="var(--amber)" />
          <span>{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="Fechar modal">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p>{description}</p>
          {hint ? <p>{hint}</p> : null}
        </div>
        <div className="modal-footer">
          <button className="modal-ok-btn" onClick={onClose}>Ok</button>
        </div>
      </div>
    </div>
  )
}
