import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const supabase = createServerClient()

    const { error } = await supabase.auth.admin.deleteUser(session.user.id)
    if (error) {
      return NextResponse.json(
        { error: 'Não foi possível eliminar a conta.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { deleted: true }, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao eliminar conta.' }, { status: 500 })
  }
}
