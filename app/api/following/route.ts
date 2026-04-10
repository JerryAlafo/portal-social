import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/following — list users the current user follows
export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('follows')
      .select('following:profiles!follows_following_id_fkey(id, username, display_name, avatar_initials, avatar_url, is_online)')
      .eq('follower_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ data: data?.map(d => d.following) ?? [], error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar seguidos.' }, { status: 500 })
  }
}

// POST /api/following — follow a user
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { user_id } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id obrigatório.' }, { status: 400 })
    if (user_id === session.user.id) return NextResponse.json({ error: 'Não podes seguir-te a ti mesmo.' }, { status: 400 })

    const supabase = createServerClient()

    await supabase.from('follows').upsert({ follower_id: session.user.id, following_id: user_id })

    return NextResponse.json({ data: { following: true }, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao seguir utilizador.' }, { status: 500 })
  }
}

// DELETE /api/following — unfollow a user
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { user_id } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id obrigatório.' }, { status: 400 })

    const supabase = createServerClient()

    await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', user_id)

    return NextResponse.json({ data: { following: false }, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao deixar de seguir.' }, { status: 500 })
  }
}
