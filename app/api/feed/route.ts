import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const category = searchParams.get('category')
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

    if (category && category !== 'Tudo') {
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

    const supabase = createServerClient()

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ author_id: session.user.id, content, category: category ?? null, image_url: image_url ?? null })
      .select(`*, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_initials, avatar_url, role)`)
      .single()

    if (error) throw error

    return NextResponse.json({ data: { ...post, liked_by_me: false }, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar publicação.' }, { status: 500 })
  }
}
