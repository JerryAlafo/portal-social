import { signOut } from 'next-auth/react'

export function logout() {
  void signOut({ callbackUrl: '/login' })
}
