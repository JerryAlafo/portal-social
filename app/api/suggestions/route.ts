import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()

    // Suggest users not already followed by the current user
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id)

    const followingIds = [
      session.user.id,
      ...(following?.map(f => f.following_id) ?? []),
    ]

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_initials, avatar_url, followers_count')
      .not('id', 'in', `(${followingIds.join(',')})`)
      .order('followers_count', { ascending: false })
      .limit(5)

    if (error) throw error

    return NextResponse.json({ data: data ?? [], error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar sugestões.' }, { status: 500 })
  }
}
