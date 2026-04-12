import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const supabase = createServerClient()

    let query = supabase
      .from('gallery_items')
      .select('*, author:profiles!gallery_items_author_id_fkey(id, username, display_name, avatar_initials, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(40)

    if (category) query = query.eq('category', category)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data: data ?? [], error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar galeria.' }, { status: 500 })
  }
}
