import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role
    if (role !== 'superuser') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, date, location, image_url, date_color } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'Título e data são obrigatórios' }, { status: 400 })
    }

    const supabase = createServerClient()
    const userId = session.user.id

    const { data, error } = await supabase
      .from('events')
      .insert({
        title,
        description: description || null,
        date: new Date(date).toISOString(),
        location: location || null,
        image_url: image_url || null,
        organizer_id: userId,
        date_color: date_color || '#7c5cfc',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('Create event error:', err)
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role
    if (role !== 'superuser') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const { id, title, description, date, location, image_url, date_color } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('events')
      .update({
        title,
        description: description || null,
        date: date ? new Date(date).toISOString() : null,
        location: location || null,
        image_url: image_url || null,
        date_color: date_color || '#7c5cfc',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('Update event error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar evento' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const role = (session.user as { role?: string }).role
    if (role !== 'superuser') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ data: true, error: null })
  } catch (err) {
    console.error('Delete event error:', err)
    return NextResponse.json({ error: 'Erro ao eliminar evento' }, { status: 500 })
  }
}