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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let data: unknown[] = []
    let hasMore = false

    if (tab === 'posts') {
      const { data: posts } = await supabase
        .from('posts')
        .select('*, author:profiles(id, username, display_name, avatar_initials, avatar_url, role)')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit)
      hasMore = (posts?.length ?? 0) > limit
      data = (posts || []).slice(0, limit)

      if (session?.user?.id && data.length > 0) {
        const postIds = (data as Array<{ id: string }>).map((item) => item.id)
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', session.user.id)
          .in('post_id', postIds)

        const likedSet = new Set(likes?.map((item) => item.post_id))
        data = (data as Array<{ id: string }>).map((post) => ({
          ...post,
          liked_by_me: likedSet.has(post.id),
        }))
      }
    } else if (tab === 'fanfics') {
      const { data: fanfics } = await supabase
        .from('fanfics')
        .select('*')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit)
      hasMore = (fanfics?.length ?? 0) > limit
      data = (fanfics || []).slice(0, limit)
    } else if (tab === 'gallery') {
      const { data: gallery } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit)
      hasMore = (gallery?.length ?? 0) > limit
      data = (gallery || []).slice(0, limit)
    }

    return NextResponse.json({
      profile: { ...profile, is_following: isFollowing },
      data,
      page,
      limit,
      hasMore,
      error: null,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar perfil.' }, { status: 500 })
  }
}
