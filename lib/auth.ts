import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthConfig } from 'next-auth'
import { createServerClient } from '@/lib/supabase-server'
import { verifyTurnstileToken } from '@/lib/turnstile'

const supabase = createServerClient()

export const authOptions: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Portal Otaku',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        turnstileToken: { label: 'Turnstile Token', type: 'text' },
      },
      async authorize(credentials) {
        if (
          !credentials ||
          typeof credentials.email !== 'string' ||
          typeof credentials.password !== 'string' ||
          typeof credentials.turnstileToken !== 'string' ||
          !credentials.email ||
          !credentials.password ||
          !credentials.turnstileToken
        ) {
          return null
        }

        const isTurnstileValid = await verifyTurnstileToken(credentials.turnstileToken)
        if (!isTurnstileValid) {
          return null
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error || !data.user) {
          return null
        }

        const user = data.user

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, display_name, role, avatar_initials, avatar_url')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          return null
        }

        const avatarInitials =
          profile?.avatar_initials ||
          user.user_metadata?.avatar_initials ||
          user.email?.slice(0, 2).toUpperCase() ||
          ''

        return {
          id: user.id,
          email: user.email ?? '',
          name: profile?.display_name ?? user.email ?? '',
          username: profile?.username ?? user.user_metadata?.username ?? '',
          role: profile?.role ?? 'member',
          avatar_initials: avatarInitials,
          avatar_url: profile?.avatar_url ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.avatar_initials = user.avatar_initials
        token.avatar_url = user.avatar_url
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.avatar_initials = token.avatar_initials as string
        session.user.avatar_url = token.avatar_url as string | null
      }
      return session
    },
  },
}

export const auth = async () => {
  const { headers } = await import('next/headers')
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, role, avatar_initials, avatar_url')
    .eq('id', session.user.id)
    .single()

  const avatarInitials = profile?.avatar_initials || session.user.email?.slice(0, 2).toUpperCase() || ''

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
      name: profile?.display_name ?? session.user.email ?? '',
      username: profile?.username ?? '',
      role: profile?.role ?? 'member',
      avatar_initials: avatarInitials,
      avatar_url: profile?.avatar_url ?? null,
    },
  }
}
