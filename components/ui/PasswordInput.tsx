'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import styles from './PasswordInput.module.css'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  inputClassName?: string
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  required,
  className,
  inputClassName,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
              <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className={inputClassName ?? styles.input}
              />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Ocultar password' : 'Mostrar password'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
