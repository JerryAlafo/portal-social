import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const tab = searchParams.get('tab') ?? 'posts'
    const offset = (page - 1) * limit

    const supabase = createServerClient()

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
    }

    let data: unknown[] = []
    let hasMore = false

    if (tab === 'posts') {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, username, display_name, avatar_initials, avatar_url, role)
        `)
        .eq('author_id', id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit)

      if (error) throw error
      hasMore = (posts?.length ?? 0) > limit
      data = posts?.slice(0, limit) ?? []

      // Check likes
      const postIds = data.map(p => (p as { id: string }).id)
      if (postIds.length > 0) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', session.user.id)
          .in('post_id', postIds)

        const likedSet = new Set(likes?.map(l => l.post_id))
        data = (data as Array<{ id: string }>).map(p => ({
          ...p,
          liked_by_me: likedSet.has(p.id),
        }))
      }
    } else if (tab === 'fanfics') {
      const { data: fanfics, error } = await supabase
        .from('fanfics')
        .select('*')
        .eq('author_id', id)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit)

      if (error) throw error
      hasMore = (fanfics?.length ?? 0) > limit
      data = fanfics?.slice(0, limit) ?? []
    } else if (tab === 'gallery') {
      const { data: gallery, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('author_id', id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit)

      if (error) throw error
      hasMore = (gallery?.length ?? 0) > limit
      data = gallery?.slice(0, limit) ?? []
    } else if (tab === 'likes' || tab === 'gostos') {
      const { data: likedPosts, error } = await supabase
        .from('post_likes')
        .select('post_id, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit)

      if (error) throw error
      hasMore = (likedPosts?.length ?? 0) > limit
      const slicedLiked = likedPosts?.slice(0, limit) ?? []
      
      if (slicedLiked.length > 0) {
        const postIds = slicedLiked.map(l => l.post_id)
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            author:profiles!posts_author_id_fkey(id, username, display_name, avatar_initials, avatar_url, role)
          `)
          .in('id', postIds)

        if (postsError) throw postsError
        
        const postsWithLikedByMe = (posts ?? []).map(p => ({
          ...p,
          liked_by_me: true,
        }))
        data = postsWithLikedByMe
      } else {
        data = []
      }
    }

    return NextResponse.json({
      profile,
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