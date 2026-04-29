import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_initials, avatar_url)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw error

    const filtered = (data ?? []).filter(n => n.actor !== null)
    return NextResponse.json({ data: filtered, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar notificações.' }, { status: 500 })
  }
}

// Mark all as read
export async function PATCH() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)

    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar notificações.' }, { status: 500 })
  }
}
