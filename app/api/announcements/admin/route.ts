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
    const { title, content, status, pinned } = body

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content: content || null,
        status: status || 'draft',
        pinned: pinned || false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('Create announcement error:', err)
    return NextResponse.json({ error: 'Erro ao criar anúncio' }, { status: 500 })
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
    const { id, title, content, status, pinned } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('announcements')
      .update({
        title,
        content: content || null,
        status: status || 'draft',
        pinned: pinned || false,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (err) {
    console.error('Update announcement error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar anúncio' }, { status: 500 })
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
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ data: true, error: null })
  } catch (err) {
    console.error('Delete announcement error:', err)
    return NextResponse.json({ error: 'Erro ao eliminar anúncio' }, { status: 500 })
  }
}