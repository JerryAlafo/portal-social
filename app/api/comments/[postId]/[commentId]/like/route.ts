import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(_req: Request, props: { params: Promise<{ postId: string; commentId: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { commentId } = await props.params
    const supabase = createServerClient()

    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', session.user.id)
      .single()

    let liked: boolean
    let likes_count = 0

    if (existing) {
      await supabase.from('comment_likes').delete().eq('id', existing.id)
      const { count } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId)
      liked = false
      likes_count = count ?? 0
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: session.user.id })
      const { count } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId)
      liked = true
      likes_count = count ?? 0
    }

    await supabase
      .from('comments')
      .update({ likes_count })
      .eq('id', commentId)

    return NextResponse.json({ data: { liked, likes_count }, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao dar like no comentário.' }, { status: 500 })
  }
}
