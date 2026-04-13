import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id } = await props.params
    const supabase = createServerClient()

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, username, display_name, avatar_initials, avatar_url, role)
      `)
      .eq('id', id)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 })
    }

    const { data: liked } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    return NextResponse.json({
      data: { ...post, liked_by_me: Boolean(liked) },
      error: null,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar publicação.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id } = await props.params
    const supabase = createServerClient()

    // Only author or admin can delete
    const { data: post } = await supabase.from('posts').select('author_id').eq('id', id).single()

    if (!post) return NextResponse.json({ error: 'Publicação não encontrada.' }, { status: 404 })

    if (post.author_id !== session.user.id && session.user.role !== 'superuser' && session.user.role !== 'mod') {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao apagar publicação.' }, { status: 500 })
  }
}
