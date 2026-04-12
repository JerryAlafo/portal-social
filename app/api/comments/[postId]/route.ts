import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(_req: Request, props: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await props.params
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('comments')
      .select('*, author:profiles(id, username, display_name, avatar_initials, avatar_url)')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data: data ?? [], error: null })
  } catch (err) {
    console.error('GET comments error:', err)
    return NextResponse.json({ error: 'Erro ao carregar comentários.' }, { status: 500 })
  }
}

export async function POST(request: Request, props: { params: Promise<{ postId: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { postId } = await props.params
    const { content, parent_id } = await request.json()

    if (!content?.trim()) return NextResponse.json({ error: 'Comentário vazio.' }, { status: 400 })
    if (content.length > 500) return NextResponse.json({ error: 'Máximo 500 caracteres.' }, { status: 400 })

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: session.user.id, content: content.trim(), parent_id: parent_id ?? null })
      .select('*, author:profiles(id, username, display_name, avatar_initials, avatar_url)')
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (err) {
    console.error('POST comment error:', err)
    return NextResponse.json({ error: 'Erro ao publicar comentário.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ postId: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { postId } = await props.params
    const { comment_id, content } = await request.json()

    if (!content?.trim()) return NextResponse.json({ error: 'Comentário vazio.' }, { status: 400 })
    if (content.length > 500) return NextResponse.json({ error: 'Máximo 500 caracteres.' }, { status: 400 })

    const supabase = createServerClient()

    const { data: comment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', comment_id)
      .eq('post_id', postId)
      .single()

    if (!comment) return NextResponse.json({ error: 'Comentário não encontrado.' }, { status: 404 })
    if (comment.author_id !== session.user.id) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const { data, error } = await supabase
      .from('comments')
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq('id', comment_id)
      .select('*, author:profiles(id, username, display_name, avatar_initials, avatar_url)')
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('PATCH comment error:', err)
    return NextResponse.json({ error: 'Erro ao editar comentário.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ postId: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { postId } = await props.params
    const { comment_id } = await request.json()

    const supabase = createServerClient()

    const { data: comment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', comment_id)
      .eq('post_id', postId)
      .single()

    if (!comment) return NextResponse.json({ error: 'Comentário não encontrado.' }, { status: 404 })

    const canDelete = comment.author_id === session.user.id ||
      session.user.role === 'mod' || session.user.role === 'superuser'

    if (!canDelete) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    await supabase.from('comments').delete().eq('parent_id', comment_id)
    const { error } = await supabase.from('comments').delete().eq('id', comment_id)
    if (error) throw error

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    console.error('DELETE comment error:', err)
    return NextResponse.json({ error: 'Erro ao apagar comentário.' }, { status: 500 })
  }
}
