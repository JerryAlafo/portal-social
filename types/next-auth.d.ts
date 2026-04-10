import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    username?: string
    role?: string
    avatar_initials?: string
  }

  interface Session {
    user: {
      id: string
      username: string
      role: string
      avatar_initials: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    username?: string
    role?: string
    avatar_initials?: string
  }
}
