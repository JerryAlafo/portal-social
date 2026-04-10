import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()

    // Get all conversations where user is a participant
    const { data: participations, error } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', session.user.id)

    if (error) throw error

    const convIds = participations?.map(p => p.conversation_id) ?? []
    if (convIds.length === 0) return NextResponse.json({ data: [], error: null })

    // For each conversation, get the other participant and last message
    const conversations = await Promise.all(
      convIds.map(async (conv_id) => {
        const { data: parts } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv_id)
          .neq('user_id', session.user.id)

        const otherId = parts?.[0]?.user_id
        const { data: otherUser } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_initials, avatar_url, is_online')
          .eq('id', otherId)
          .single()

        const { data: lastMsgArr } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv_id)
          .order('created_at', { ascending: false })
          .limit(1)

        const { count: unread } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv_id)
          .eq('is_read', false)
          .neq('sender_id', session.user.id)

        return {
          id: conv_id,
          other_user: otherUser,
          last_message: lastMsgArr?.[0] ?? null,
          unread_count: unread ?? 0,
        }
      })
    )

    // Sort by last message date
    conversations.sort((a, b) => {
      const aTime = a.last_message?.created_at ?? ''
      const bTime = b.last_message?.created_at ?? ''
      return bTime.localeCompare(aTime)
    })

    return NextResponse.json({ data: conversations, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar conversas.' }, { status: 500 })
  }
}
