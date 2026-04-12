import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id: conversation_id } = await props.params
    const supabase = createServerClient()

    // Verify user is participant
    const { data: participation } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', session.user.id)
      .single()

    if (!participation) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })

    // Mark all messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation_id)
      .neq('sender_id', session.user.id)
      .eq('is_read', false)

    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao marcar mensagens como lidas.' }, { status: 500 })
  }
}
