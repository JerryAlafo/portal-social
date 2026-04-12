import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    const session = await auth()
    const supabase = createServerClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 })
    }

    let isFollowing = false
    if (session?.user?.id && session.user.id !== profile.id) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', profile.id)
        .single()
      isFollowing = !!followData
    }

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'posts'
    const limit = parseInt(searchParams.get('limit') || '20')

    let data: unknown[] = []

    if (tab === 'posts') {
      const { data: posts } = await supabase
        .from('posts')
        .select('*, author:profiles(id, username, display_name, avatar_initials, avatar_url, role)')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      data = posts || []
    } else if (tab === 'fanfics') {
      const { data: fanfics } = await supabase
        .from('fanfics')
        .select('*')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      data = fanfics || []
    } else if (tab === 'gallery') {
      const { data: gallery } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      data = gallery || []
    }

    return NextResponse.json({ profile: { ...profile, is_following: isFollowing }, data, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar perfil.' }, { status: 500 })
  }
}
