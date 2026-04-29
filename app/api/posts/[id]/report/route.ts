import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id } = await props.params
    const body = await request.json()
    const { reason, description } = body

    if (!reason || !['spam', 'explicit', 'harassment', 'other'].includes(reason)) {
      return NextResponse.json({ error: 'Motivo inválido.' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: post } = await supabase.from('posts').select('id, author_id').eq('id', id).single()
    if (!post) return NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 })

    if (post.author_id === session.user.id) {
      return NextResponse.json({ error: 'Não podes denunciar o teu próprio post.' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('reported_posts')
      .select('id')
      .eq('post_id', id)
      .eq('reporter_id', session.user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Já denunciaste esta publicação.' }, { status: 409 })
    }

    const { data: report, error } = await supabase
      .from('reported_posts')
      .insert({
        post_id: id,
        reporter_id: session.user.id,
        reason,
        description: description?.trim() || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: report, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao denunciar publicação.' }, { status: 500 })
  }
}
