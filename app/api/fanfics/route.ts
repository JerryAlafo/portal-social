import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const fandom = searchParams.get('fandom')
    const sort = searchParams.get('sort') ?? 'recent' // recent | popular

    const supabase = createServerClient()

    let query = supabase
      .from('fanfics')
      .select('*, author:profiles!fanfics_author_id_fkey(id, username, display_name, avatar_initials)')
      .limit(30)

    if (fandom) query = query.eq('fandom', fandom)

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
