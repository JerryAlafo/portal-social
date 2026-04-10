import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
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

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation_id)
      .neq('sender_id', session.user.id)

    return NextResponse.json({ data: messages, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar mensagens.' }, { status: 500 })
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id: conversation_id } = await props.params
    const { content } = await request.json()

    if (!content?.trim()) return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })

    const supabase = createServerClient()

    // Verify user is participant
    const { data: participation } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', session.user.id)
      .single()

    if (!participation) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })

    const { data: message, error } = await supabase
      .from('messages')
      .insert({ conversation_id, sender_id: session.user.id, content })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: message, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao enviar mensagem.' }, { status: 500 })
  }
}
