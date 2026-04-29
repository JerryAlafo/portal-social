import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/following — list users the current user follows or check if following a specific user
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const checkUserId = searchParams.get('check')

    // If check parameter is provided, return whether following that user
    if (checkUserId) {
      const { data: followData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', session.user.id)
        .eq('following_id', checkUserId)
        .single()

      return NextResponse.json({
        data: { following: !!followData },
        error: null
      })
    }

    // Otherwise return full following list
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

// POST /api/following — toggle follow (like likes pattern)
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { user_id } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id obrigatório.' }, { status: 400 })
    if (user_id === session.user.id) return NextResponse.json({ error: 'Não podes seguir-te a ti mesmo.' }, { status: 400 })

    const supabase = createServerClient()

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', session.user.id)
      .eq('following_id', user_id)
      .single()

    if (existing) {
      // Unfollow
      await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', user_id)
      return NextResponse.json({ data: { following: false }, error: null })
    } else {
      // Follow
      await supabase.from('follows').insert({ follower_id: session.user.id, following_id: user_id })

      // Create notification for the followed user
      await supabase.from('notifications').insert({
        user_id: user_id,
        actor_id: session.user.id,
        type: 'follow',
        post_id: null,
      })

      return NextResponse.json({ data: { following: true }, error: null })
    }
  } catch {
    return NextResponse.json({ error: 'Erro ao processar seguir.' }, { status: 500 })
  }
}
