import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) return NextResponse.json({ error: 'user_id obrigatório.' }, { status: 400 })

    const supabase = createServerClient()

    // Verify the target user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 })
    }

    // Find existing conversation where both users are participants
    const { data: existingConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', session.user.id)

    let conversationId: string | null = null

    if (existingConvs && existingConvs.length > 0) {
      const convIds = existingConvs.map(c => c.conversation_id)
      
      // Find conversation where both users participate
      const { data: bothParts } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('user_id', userId)
        .maybeSingle()

      if (bothParts) {
        conversationId = bothParts.conversation_id
      }
    }

    if (!conversationId) {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single()

      if (convError || !newConv) {
        console.error('Conversation creation error:', convError)
        return NextResponse.json({ error: 'Erro ao criar conversa.' }, { status: 500 })
      }

      conversationId = newConv.id

      // Add participants
      const { error: partError } = await supabase.from('conversation_participants').insert([
        { conversation_id: conversationId, user_id: session.user.id },
        { conversation_id: conversationId, user_id: userId },
      ])

      if (partError) {
        console.error('Participant insert error:', partError)
      }
    }

    // Get the other user's info
    const { data: otherUser } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_initials, avatar_url, is_online')
      .eq('id', userId)
      .single()

    // Get last message
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('content, created_at, sender_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!otherUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        id: conversationId,
        other_user: otherUser,
        last_message: lastMsg,
        unread_count: 0,
      },
      error: null
    })
  } catch (err) {
    console.error('Get or create conversation error:', err)
    return NextResponse.json({ error: 'Erro ao buscar conversa.' }, { status: 500 })
  }
}
