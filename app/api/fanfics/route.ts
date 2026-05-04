import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'
import { hitRateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get('genre')
    const sort = searchParams.get('sort') ?? 'recent'

    const supabase = createServerClient()
    const session = await auth()

    let query = supabase
      .from('fanfics')
      .select('*, author:profiles!fanfics_author_id_fkey(id, username, display_name, avatar_initials, avatar_url)')
      .limit(30)

    if (genre) query = query.eq('genre', genre)

    query = sort === 'popular'
      ? query.order('likes_count', { ascending: false })
      : query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    const fanficIds = data?.map((f) => f.id) ?? []
    const likes = session?.user?.id && fanficIds.length > 0
      ? (await supabase
        .from('fanfic_likes')
        .select('fanfic_id')
        .eq('user_id', session.user.id)
        .in('fanfic_id', fanficIds)).data
      : []

    const likedSet = new Set(likes?.map((l) => l.fanfic_id))
    const fanficsWithLikes = data?.map((f) => ({ ...f, liked_by_me: likedSet.has(f.id) })) ?? []

    return NextResponse.json({ data: fanficsWithLikes, error: null })
  } catch (err) {
    console.error('Erro ao carregar fanfics:', err)
    return NextResponse.json({ error: 'Erro ao carregar fanfics.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

    const body = await request.json()
    const title = String(body?.title ?? '').trim()
    const synopsis = String(body?.summary ?? '').trim()
    const genre = String(body?.genre ?? '').trim()
    const fandom = String(body?.fandom ?? '').trim()
    const statusInput = String(body?.status ?? 'Em curso').trim()

    if (!title) return NextResponse.json({ error: 'Titulo e obrigatorio.' }, { status: 400 })
    if (!synopsis) return NextResponse.json({ error: 'Resumo e obrigatorio.' }, { status: 400 })
    if (hitRateLimit(`fanfic:${session.user.id}`, 3, 5 * 60_000)) {
      return NextResponse.json({ error: 'Muitas fanfics criadas em pouco tempo.' }, { status: 429 })
    }

    const wordCount = synopsis.trim().split(/\s+/).filter(Boolean).length

    const statusMap: Record<string, string> = {
      'Em curso': 'ongoing',
      'Completo': 'complete',
      'Pausado': 'hiatus',
    }
    const status = statusMap[statusInput] || 'ongoing'

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('fanfics')
      .insert({
        author_id: session.user.id,
        title,
        synopsis,
        genre: genre || null,
        fandom: fandom || null,
        status,
        chapters: 1,
        words: wordCount,
      })
      .select('*, author:profiles!fanfics_author_id_fkey(id, username, display_name, avatar_initials, avatar_url)')
      .single()

    if (error) throw error
    return NextResponse.json({ data: { ...data, liked_by_me: false }, error: null }, { status: 201 })
  } catch (err) {
    console.error('Erro ao publicar fanfic:', err)
    return NextResponse.json({ error: 'Erro ao publicar fanfic.' }, { status: 500 })
  }
}
