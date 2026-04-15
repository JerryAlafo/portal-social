import { signOut } from 'next-auth/react'

export async function logout() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('user_avatar_'))
  keys.forEach(k => localStorage.removeItem(k))
  localStorage.removeItem('user_avatar_url')
  await signOut({ callbackUrl: '/login' })
}
