import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()
    const userId = session.user.id

    const { count: unreadMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)

    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    return NextResponse.json({
      data: {
        unreadMessages: unreadMessages ?? 0,
        unreadNotifications: unreadNotifications ?? 0,
        followingCount: followingCount ?? 0,
      },
      error: null
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar contagens.' }, { status: 500 })
  }
}
