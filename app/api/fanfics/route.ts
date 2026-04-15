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

    return NextResponse.json({ data: data ?? [], error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar fanfics.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await request.json()
    const title = String(body?.title ?? '').trim()
    const summary = String(body?.summary ?? '').trim()
    const genre = String(body?.genre ?? '').trim()
    const fandom = String(body?.fandom ?? '').trim()
    const status = String(body?.status ?? 'Em curso').trim()
    const chapters = Math.max(1, Number(body?.chapters ?? 1))
    const words_count = Math.max(100, Number(body?.words_count ?? 100))
    const attachment_url = body?.attachment_url ? String(body.attachment_url) : null
    const attachment_name = body?.attachment_name ? String(body.attachment_name) : null

    if (!title) return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 })
    if (!summary) return NextResponse.json({ error: 'Resumo é obrigatório.' }, { status: 400 })
    if (hitRateLimit(`fanfic:${session.user.id}`, 3, 5 * 60_000)) {
      return NextResponse.json({ error: 'Muitas fanfics criadas em pouco tempo.' }, { status: 429 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('fanfics')
      .insert({
        author_id: session.user.id,
        title,
        summary,
        genre: genre || null,
        fandom: fandom || null,
        status,
        chapters,
        words_count,
        attachment_url,
        attachment_name,
      })
      .select('*, author:profiles!fanfics_author_id_fkey(id, username, display_name, avatar_initials, avatar_url)')
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao publicar fanfic.' }, { status: 500 })
  }
}
