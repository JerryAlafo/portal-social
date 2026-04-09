import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'PORTAL — Rede Social para Otakus',
  description: 'A rede social criada para a comunidade de anime e manga.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" data-theme="dark">
      <body>{children}</body>
    </html>
  )
}
