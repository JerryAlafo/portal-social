import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { id } = await props.params
    const { role } = await request.json()

    if (!['member', 'mod', 'superuser'].includes(role)) {
      return NextResponse.json({ error: 'Role inválido.' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!adminProfile || (adminProfile.role !== 'superuser' && adminProfile.role !== 'mod')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    if (adminProfile.role !== 'superuser' && role === 'superuser') {
      return NextResponse.json({ error: 'Apenas superusers podem atribuir superuser.' }, { status: 403 })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Erro ao atualizar role.' }, { status: 500 })
    }

    return NextResponse.json({ data: { success: true }, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
