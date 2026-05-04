import { auth } from '@/lib/auth'
import { isGuestBlockedPath, isGuestPublicPath, GUEST_MODE_COOKIE } from '@/lib/guest-mode'
import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|banned|logout|.*\\..*).*)',
  ],
}

async function isUserBanned(userId: string): Promise<boolean> {
  const supabase = createServerClient()
  const { data: banChecks } = await supabase
    .from('banned_users')
    .select('expires_at')
    .eq('user_id', userId)

  if (!banChecks || banChecks.length === 0) return false

  return banChecks.some((ban) => {
    const isPermanent = !ban.expires_at
    const isActive = ban.expires_at && new Date(ban.expires_at) > new Date()
    return isPermanent || isActive
  })
}

function redirectToLoginRequired(request: NextRequest) {
  const url = new URL('/feed', request.url)
  url.searchParams.set('loginRequired', '1')
  url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const session = await auth()

  const isLoggedIn = !!session?.user
  const isGuest = request.cookies.get(GUEST_MODE_COOKIE)?.value === '1'
  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname === '/login'
  const isRootPage = pathname === '/'
  const isBannedPage = pathname === '/banned'
  const isLogoutPage = pathname === '/logout'
  const isOnboardingPage = pathname === '/onboarding'

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  if (isRootPage && (isLoggedIn || isGuest)) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  if (!isLoggedIn) {
    if (isAuthPage) {
      return NextResponse.next()
    }

    if (isGuest) {
      if (isGuestBlockedPath(pathname)) {
        return redirectToLoginRequired(request)
      }

      return NextResponse.next()
    }

    if (isGuestPublicPath(pathname)) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session?.user?.id && !isBannedPage && !isLogoutPage) {
    const banned = await isUserBanned(session.user.id)
    if (banned) {
      return NextResponse.redirect(new URL('/banned', request.url))
    }
  }

  if (!isOnboardingPage && session?.user?.username) {
    return NextResponse.next()
  }

  if (!isOnboardingPage && !session?.user?.username) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.next()
}
