import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { auth } from '@/auth'

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

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await request.json()
    const title = String(body?.title ?? '').trim()
    const category = String(body?.category ?? '').trim()
    const image_url = body?.image_url ? String(body.image_url) : null

    if (!title) return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 })
    if (!image_url) return NextResponse.json({ error: 'Imagem é obrigatória.' }, { status: 400 })

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('gallery_items')
      .insert({
        author_id: session.user.id,
        title,
        category: category || 'Arte',
        image_url,
        likes_count: 0,
      })
      .select('*, author:profiles!gallery_items_author_id_fkey(id, username, display_name, avatar_initials, avatar_url)')
      .single()

    if (error) {
      console.error('Gallery insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (err) {
    console.error('Gallery POST error:', err)
    return NextResponse.json({ error: 'Erro ao publicar na galeria.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await request.json()
    const { id, action } = body

    console.log('Gallery PATCH:', { id, action, user_id: session.user.id })

    if (!id || !action) return NextResponse.json({ error: 'ID e ação são obrigatórios.' }, { status: 400 })

    const supabase = createServerClient()

    if (action === 'like') {
      const { data: existing } = await supabase
        .from('gallery_likes')
        .select('*')
        .eq('item_id', id)
        .eq('user_id', session.user.id)
        .maybeSingle()

      console.log('Existing like:', existing)

      const { data: currentItem } = await supabase
        .from('gallery_items')
        .select('likes_count')
        .eq('id', id)
        .single()
      const currentLikes = currentItem?.likes_count ?? 0

      if (existing) {
        await supabase
          .from('gallery_likes')
          .delete()
          .eq('item_id', id)
          .eq('user_id', session.user.id)

        await supabase
          .from('gallery_items')
          .update({ likes_count: Math.max(0, currentLikes - 1) })
          .eq('id', id)
      } else {
        await supabase
          .from('gallery_likes')
          .insert({ item_id: id, user_id: session.user.id })

        await supabase
          .from('gallery_items')
          .update({ likes_count: currentLikes + 1 })
          .eq('id', id)
      }

      const { data: item } = await supabase
        .from('gallery_items')
        .select('likes_count')
        .eq('id', id)
        .single()

      return NextResponse.json({ data: { likes_count: item?.likes_count ?? 0 }, error: null })
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  } catch (err) {
    console.error('Gallery PATCH error:', err)
    return NextResponse.json({ error: 'Erro ao processar ação.' }, { status: 500 })
  }
}
