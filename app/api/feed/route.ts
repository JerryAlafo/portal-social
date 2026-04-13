import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'
import { hitRateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const category = searchParams.get('category')
    const filter = searchParams.get('filter')
    const offset = (page - 1) * limit

    const supabase = createServerClient()

    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, username, display_name, avatar_initials, avatar_url, role)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filter === 'following') {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', session.user.id)
      
      const followingIds = following?.map(f => f.following_id) ?? []
      if (followingIds.length > 0) {
        query = query.in('author_id', followingIds)
      } else {
        return NextResponse.json({ data: [], page, limit, error: null })
      }
    } else if (filter === 'trending') {
      query = query.order('likes_count', { ascending: false }).order('shares_count', { ascending: false })
    } else if (filter === 'hot') {
      query = query.order('likes_count', { ascending: false }).order('comments_count', { ascending: false })
    } else if (filter === 'top') {
      query = query.order('likes_count', { ascending: false })
    } else if (category && category !== 'Tudo') {
      query = query.eq('category', category)
    }

    const { data: posts, error } = await query

    if (error) throw error

    // Check which posts the current user has liked
    const postIds = posts?.map(p => p.id) ?? []
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', session.user.id)
      .in('post_id', postIds)

    const likedSet = new Set(likes?.map(l => l.post_id))
    const postsWithLikes = posts?.map(p => ({ ...p, liked_by_me: likedSet.has(p.id) })) ?? []

    return NextResponse.json({ data: postsWithLikes, page, limit, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar feed.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { content, category, image_url } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'O conteúdo não pode estar vazio.' }, { status: 400 })
    }

    const isFlooding = hitRateLimit(`post:${session.user.id}`, 6, 60_000)
    if (isFlooding) {
      return NextResponse.json(
        { error: 'Estás a publicar demasiado rápido. Tenta novamente em instantes.' },
        { status: 429 }
      )
    }

    const supabase = createServerClient()

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ author_id: session.user.id, content, category: category ?? null, image_url: image_url ?? null })
      .select(`*, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_initials, avatar_url, role)`)
      .single()

    if (error) throw error

    const { data: followers } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', session.user.id)

    const followerIds = followers?.map((item) => item.follower_id) ?? []
    if (followerIds.length > 0) {
      await supabase.from('notifications').insert(
        followerIds.map((followerId) => ({
          user_id: followerId,
          actor_id: session.user.id,
          type: 'mention',
          post_id: post.id,
        }))
      )
    }

    return NextResponse.json({ data: { ...post, liked_by_me: false }, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar publicação.' }, { status: 500 })
  }
}
