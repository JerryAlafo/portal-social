import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { headers } = await import('next/headers')
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return NextResponse.json({ data: [], error: null })

    const { data, error } = await supabase
      .from('gallery_likes')
      .select('item_id')
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ data: data ?? [], error: null })
  } catch (err) {
    console.error('Gallery likes GET error:', err)
    return NextResponse.json({ error: 'Erro ao carregar likes.' }, { status: 500 })
  }
}