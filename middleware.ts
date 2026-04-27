import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|banned|logout|onboarding|.*\\..*).*)',
  ],
}

async function isUserBanned(userId: string): Promise<boolean> {
  const supabase = createServerClient()
  const { data: banChecks } = await supabase
    .from('banned_users')
    .select('expires_at')
    .eq('user_id', userId)

  if (!banChecks || banChecks.length === 0) return false

  // Check if any ban is active
  return banChecks.some(ban => {
    const isPermanent = !ban.expires_at
    const isActive = ban.expires_at && new Date(ban.expires_at) > new Date()
    return isPermanent || isActive
  })
}

export async function middleware(request: NextRequest) {
  const session = await auth()
  
  const isLoggedIn = !!session?.user
  const isAuthPage = request.nextUrl.pathname === '/login'
  const isRootPage = request.nextUrl.pathname === '/'
  const isBannedPage = request.nextUrl.pathname === '/banned'
  const isLogoutPage = request.nextUrl.pathname === '/logout'
  const isOnboardingPage = request.nextUrl.pathname === '/onboarding'

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  if (isRootPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  if (!isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check if user is banned
  if (isLoggedIn && session?.user?.id && !isBannedPage && !isLogoutPage) {
    const banned = await isUserBanned(session.user.id)
    if (banned) {
      return NextResponse.redirect(new URL('/banned', request.url))
    }
  }

  // Check if user needs onboarding (no username set)
  if (isLoggedIn && !isOnboardingPage && session?.user?.username) {
    // User has username, allow access
    return NextResponse.next()
  }

  if (isLoggedIn && !isOnboardingPage && !session?.user?.username) {
    // User doesn't have username, redirect to onboarding
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.next()
}