'use client'

import { ThemeProvider } from '@/lib/theme-context'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import Sidebar from './Sidebar'
import styles from './AppShell.module.css'

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar()
  return (
    <div className={styles.shell}>
      {isOpen && <div className={styles.mobileOverlay} onClick={close} />}
      <Sidebar />
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <ShellInner>{children}</ShellInner>
      </SidebarProvider>
    </ThemeProvider>
  )
}
