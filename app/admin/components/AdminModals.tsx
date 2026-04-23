"use client";

import { Loader2, Ban } from "lucide-react";
import styles from "../page.module.css";

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface PromptModalProps {
  show: boolean;
  title: string;
  message: string;
  promptValue: string;
  durationValue: string;
  onPromptChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

interface LoadingModalProps {
  show: boolean;
  message: string;
}

interface SuccessModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

interface ErrorModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export function ConfirmModal({ show, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!show) return null;
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalTitle}>{title}</div>
        <div className={styles.modalDescription}>{message}</div>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
          <button className={styles.saveBtn} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export function PromptModal({ show, title, message, promptValue, durationValue, onPromptChange, onDurationChange, onConfirm, onCancel }: PromptModalProps) {
  if (!show) return null;
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalTitle}>{title}</div>
        <div className={styles.modalDescription}>{message}</div>
        <div className={styles.formGroup}>
          <label>Motivo</label>
          <input type="text" value={promptValue} onChange={e => onPromptChange(e.target.value)} className={styles.promptInput} placeholder="Ex: Spam" />
        </div>
        <div className={styles.formGroup}>
          <label>Dias (vazio = permanente)</label>
          <input type="number" value={durationValue} onChange={e => onDurationChange(e.target.value)} className={styles.promptInput} placeholder="Ex: 7" />
        </div>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
          <button className={styles.saveBtn} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export function LoadingModal({ show, message }: LoadingModalProps) {
  if (!show) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.loadingModal}>
        <Loader2 size={32} className="animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}

export function SuccessModal({ show, message, onClose }: SuccessModalProps) {
  if (!show) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalTitle}>Sucesso</div>
        <div className={styles.modalDescription}>{message}</div>
        <div className={styles.modalActions}>
          <button className={styles.saveBtn} onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}

export function ErrorModal({ show, message, onClose }: ErrorModalProps) {
  if (!show) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalTitle} style={{ color: 'var(--red)' }}>Erro</div>
        <div className={styles.modalDescription}>{message}</div>
        <div className={styles.modalActions}>
          <button className={styles.saveBtn} onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}