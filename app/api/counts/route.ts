import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()
    const userId = session.user.id

    // Get unread messages count using conversations
    const { data: userConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId)

    const convIds = userConvs?.map(c => c.conversation_id) ?? []

    let unreadMessages = 0
    if (convIds.length > 0) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .neq('sender_id', userId)
        .eq('is_read', false)
      unreadMessages = count ?? 0
    }

    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      data: {
        unreadMessages: unreadMessages,
        unreadNotifications: unreadNotifications ?? 0,
        followingCount: followingCount ?? 0,
        total_posts: totalPosts ?? 0,
      },
      error: null
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar contagens.' }, { status: 500 })
  }
}
