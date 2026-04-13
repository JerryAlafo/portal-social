import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id } = await props.params
    const supabase = createServerClient()

    const { error } = await supabase.rpc('increment_shares', { post_id: id })
    if (error) throw error

    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (post && post.author_id !== session.user.id) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        actor_id: session.user.id,
        type: 'share',
        post_id: id,
      })
    }

    return NextResponse.json({ data: { shared: true }, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao partilhar.' }, { status: 500 })
  }
}
