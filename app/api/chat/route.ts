import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ data: data ?? [], error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar chat.' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()

    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ data: { cleared: true }, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao limpar chat.' }, { status: 500 })
  }
}
