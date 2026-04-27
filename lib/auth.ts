import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
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
          !credentials.email ||
          !credentials.password
        ) {
          return null
        }

        // Only verify turnstile if token is provided (skip for registered users)
        if (credentials.turnstileToken && typeof credentials.turnstileToken === 'string') {
          const isTurnstileValid = await verifyTurnstileToken(credentials.turnstileToken)
          if (!isTurnstileValid) {
            return null
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (error || !data.user) {
          return null
        }

        const user = data.user

        const { data: banCheck } = await supabase
          .from('banned_users')
          .select('id, expires_at')
          .eq('user_id', user.id)

        if (banCheck) {
          const isActive = banCheck.some(ban => {
            const isPermanent = !ban.expires_at
            const isBanActive = ban.expires_at && new Date(ban.expires_at) > new Date()
            return isPermanent || isBanActive
          })
          
          if (isActive) {
            return null
          }
        }

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
    async signIn({ user, account }) {
      // If using Google provider
      if (account?.provider === 'google') {
        try {
          // Get all users and find by email
          const { data: users, error: listError } = await supabase.auth.admin.listUsers()
          
          if (listError) {
            console.error('Error listing users:', listError)
          }
          
          let existingUser = users?.users.find(u => u.email === user.email)
          
          if (existingUser) {
            // User already exists from previous login, update user.id
            user.id = existingUser.id
            return true
          }

          // User doesn't exist in Supabase yet, try to create new user
          let data, error
          try {
            ({ data, error } = await supabase.auth.admin.createUser({
              email: user.email || '',
              email_confirm: true,
              user_metadata: {
                display_name: user.name || user.email?.split('@')[0] || '',
                provider: 'google',
              },
              app_metadata: {
                provider: 'google',
              },
            }))
          } catch (createErr: any) {
            // Handle case where user was created between listUsers and createUser
            if (createErr?.status === 422 || createErr?.code === 'email_exists') {
              // Try to get the user again
              const retry = await supabase.auth.admin.listUsers()
              existingUser = retry.data?.users.find(u => u.email === user.email)
              if (existingUser) {
                user.id = existingUser.id
                return true
              }
            }
            throw createErr
          }

          if (error || !data.user) {
            console.error('Error creating user:', error)
            // Try to find existing user by email as fallback
            const { data: retryUsers } = await supabase.auth.admin.listUsers()
            const fallback = retryUsers?.users.find(u => u.email === user.email)
            if (fallback) {
              user.id = fallback.id
              return true
            }
            return false
          }

          // Update user object with new ID for JWT
          user.id = data.user.id

          // Create profile entry (without username, will be set in onboarding)
          const nameParts = (user.name || user.email || '').split(' ')
          const avatar_initials = nameParts.slice(0, 2).map(n => n[0]).join('').toUpperCase()

          await supabase.from('profiles').insert({
            id: data.user.id,
            display_name: user.name || user.email?.split('@')[0] || '',
            avatar_initials,
          })

          return true
        } catch (err) {
          console.error('Error in signIn callback:', err)
          return true // Allow sign in even on error to avoid blocking users
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.provider = account?.provider
      }

      // Fetch profile info if not in token yet
      if (token.id && !token.username) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, display_name, role, avatar_initials, avatar_url')
          .eq('id', token.id as string)
          .single()

        if (profile) {
          token.username = profile.username
          token.role = profile.role
          token.avatar_initials = profile.avatar_initials
          token.avatar_url = profile.avatar_url
        }
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
        session.user.provider = token.provider as string | undefined
      }
      return session
    },
  },
}

const { auth, handlers } = NextAuth(authOptions)

export { auth }
export const GET = handlers.GET
export const POST = handlers.POST
