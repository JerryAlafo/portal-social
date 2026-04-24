import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { id: fanfic_id } = await props.params
    const supabase = createServerClient()

    console.log('Like request - fanfic_id:', fanfic_id, 'user_id:', session.user.id)

    const { data: existing, error: existingError } = await supabase
      .from('fanfic_likes')
      .select('fanfic_id')
      .eq('fanfic_id', fanfic_id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (existingError) {
      console.error('Erro ao verificar like:', existingError)
      return NextResponse.json({ error: 'Erro ao processar like.' }, { status: 500 })
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from('fanfic_likes')
        .delete()
        .eq('fanfic_id', fanfic_id)
        .eq('user_id', session.user.id)

      if (deleteError) {
        console.error('Erro ao remover like:', deleteError)
        return NextResponse.json({ error: 'Erro ao remover like.' }, { status: 500 })
      }

      const { data: current } = await supabase
        .from('fanfics')
        .select('likes_count')
        .eq('id', fanfic_id)
        .single()

      if (current) {
        await supabase
          .from('fanfics')
          .update({ likes_count: Math.max(0, current.likes_count - 1) })
          .eq('id', fanfic_id)
      }

      return NextResponse.json({ data: { liked: false }, error: null })
    } else {
      console.log('Inserindo like para fanfic:', fanfic_id, 'user:', session.user.id)
      const { error: insertError } = await supabase
        .from('fanfic_likes')
        .insert({ fanfic_id, user_id: session.user.id })

      if (insertError) {
        console.error('Erro ao inserir like:', insertError)
        return NextResponse.json({ error: 'Erro ao dar like.' }, { status: 500 })
      }

      const { data: current } = await supabase
        .from('fanfics')
        .select('likes_count')
        .eq('id', fanfic_id)
        .single()

      if (current) {
        await supabase
          .from('fanfics')
          .update({ likes_count: current.likes_count + 1 })
          .eq('id', fanfic_id)
      }

      const { data: fanfic } = await supabase
        .from('fanfics')
        .select('author_id')
        .eq('id', fanfic_id)
        .single()

      if (fanfic && fanfic.author_id !== session.user.id) {
        await supabase.from('notifications').insert({
          user_id: fanfic.author_id,
          actor_id: session.user.id,
          type: 'fanfic_like',
          fanfic_id,
        })
      }

      return NextResponse.json({ data: { liked: true }, error: null })
    }
  } catch (err) {
    console.error('Erro ao processar like de fanfic:', err)
    return NextResponse.json({ error: 'Erro ao processar like.' }, { status: 500 })
  }
}