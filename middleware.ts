import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const session = await auth()
  
  const isLoggedIn = !!session?.user
  const isAuthPage = request.nextUrl.pathname === '/login'
  const isRootPage = request.nextUrl.pathname === '/'

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  if (isRootPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  if (!isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}