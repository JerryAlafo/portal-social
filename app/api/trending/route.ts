import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('trending_tags')
      .select('id, tag, post_count')
      .order('post_count', { ascending: false })
      .limit(5)

    if (error) throw error

    return NextResponse.json({ data: data ?? [], error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar trending.' }, { status: 500 })
  }
}
