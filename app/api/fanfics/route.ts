import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

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
