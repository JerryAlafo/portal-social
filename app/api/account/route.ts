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
    const userId = session.user.id

    console.log('[DELETE /api/account] userId:', userId)

    // Delete profile first to avoid FK issues
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId)
    console.log('[DELETE /api/account] profile error:', profileError)

    // Delete the auth user
    const { error } = await supabase.auth.admin.deleteUser(userId)
    console.log('[DELETE /api/account] auth error:', error)
    if (error) {
      return NextResponse.json(
        { error: 'Não foi possível eliminar a conta.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { deleted: true }, error: null })
  } catch (e) {
    console.log('[DELETE /api/account] exception:', e)
    return NextResponse.json({ error: 'Erro ao eliminar conta.' }, { status: 500 })
  }
}