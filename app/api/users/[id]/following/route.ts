import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('follows')
      .select('following:profiles!follows_following_id_fkey(id, username, display_name, avatar_initials, avatar_url, is_online)')
      .eq('follower_id', id)

    if (error) throw error

    return NextResponse.json({ data: data?.map(d => d.following) ?? [], error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar seguidos.' }, { status: 500 })
  }
}
