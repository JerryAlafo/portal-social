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
    const { user_id, reason, duration_days } = body

    if (!user_id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }

    const supabase = createServerClient()
    const adminId = session.user.id

    if (user_id === adminId) {
      return NextResponse.json({ error: 'Não podes banir-te a ti mesmo' }, { status: 400 })
    }

    const expiresAt = duration_days
      ? new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000).toISOString()
      : null

    const { error } = await supabase
      .from('banned_users')
      .insert({
        user_id,
        reason: reason || null,
        banned_by: adminId,
        expires_at: expiresAt || null,
      })

    if (error) throw error

    return NextResponse.json({ data: true, error: null })
  } catch (err) {
    console.error('Ban user error:', err)
    return NextResponse.json({ error: 'Erro ao banir usuário' }, { status: 500 })
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
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('banned_users')
      .delete()
      .eq('user_id', user_id)

    if (error) throw error

    return NextResponse.json({ data: true, error: null })
  } catch (err) {
    console.error('Unban user error:', err)
    return NextResponse.json({ error: 'Erro ao desbanir usuário' }, { status: 500 })
  }
}