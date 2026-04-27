import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { id } = await props.params
    const supabase = createServerClient()

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'superuser') {
      return NextResponse.json({ error: 'Apenas superusers podem eliminar contas.' }, { status: 403 })
    }

    if (adminProfile.id === id) {
      return NextResponse.json({ error: 'Não podes eliminar a tua própria conta.' }, { status: 400 })
    }

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id)
    if (deleteAuthError) {
      return NextResponse.json({ error: 'Erro ao eliminar utilizador do Auth.' }, { status: 500 })
    }

    return NextResponse.json({ data: { success: true }, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}