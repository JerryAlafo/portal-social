import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id } = await props.params
    const supabase = createServerClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, followers_count, following_count')
      .eq('id', id)
      .single()

    if (error || !profile) return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 })

    // Check if current user follows this profile
    const { data: follow } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', session.user.id)
      .eq('following_id', id)
      .single()

    return NextResponse.json({ data: { ...profile, followed_by_me: !!follow }, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar perfil.' }, { status: 500 })
  }
}
