import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id: post_id } = await props.params
    const supabase = createServerClient()

    const { data: existing } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', post_id)
      .eq('user_id', session.user.id)
      .single()

    if (existing) {
      // Unlike
      await supabase.from('post_likes').delete().eq('post_id', post_id).eq('user_id', session.user.id)
      await supabase.rpc('decrement_likes', { post_id })
      return NextResponse.json({ data: { liked: false }, error: null })
    } else {
      // Like
      await supabase.from('post_likes').insert({ post_id, user_id: session.user.id })
      await supabase.rpc('increment_likes', { post_id })
      return NextResponse.json({ data: { liked: true }, error: null })
    }
  } catch {
    return NextResponse.json({ error: 'Erro ao processar like.' }, { status: 500 })
  }
}
