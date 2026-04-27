import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    console.log('[DELETE USER] Session:', session?.user?.id)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { id } = await props.params
    console.log('[DELETE USER] Target user ID:', id)
    const supabase = createServerClient()

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    console.log('[DELETE USER] Admin profile:', adminProfile)

    if (!adminProfile || adminProfile.role !== 'superuser') {
      console.log('[DELETE USER] Access denied - not superuser')
      return NextResponse.json({ error: 'Apenas superusers podem eliminar contas.' }, { status: 403 })
    }

    if (adminProfile.id === id) {
      console.log('[DELETE USER] Cannot delete own account')
      return NextResponse.json({ error: 'Não podes eliminar a tua própria conta.' }, { status: 400 })
    }

    console.log('[DELETE USER] Deleting user data from related tables...')
    
    const deleteTable = async (table: string) => {
      const { error } = await supabase.from(table).delete().eq('user_id', id)
      if (error) console.log(`[DELETE USER] Error deleting ${table}:`, error.message)
    }
    
    await Promise.all([
      deleteTable('likes'),
      deleteTable('comments'),
      deleteTable('posts'),
      deleteTable('gallery'),
      deleteTable('fanfics'),
      deleteTable('notifications'),
      deleteTable('banned_users'),
    ])
    
    await supabase.from('follows').delete().eq('follower_id', id)
    await supabase.from('follows').delete().eq('following_id', id)
    await supabase.from('reports').delete().eq('reporter_id', id)
    await supabase.from('profiles').delete().eq('id', id)
    
    console.log('[DELETE USER] Deleting user from auth...')
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id)
    if (deleteAuthError) {
      console.log('[DELETE USER] Auth delete error:', deleteAuthError)
      return NextResponse.json({ error: 'Erro ao eliminar utilizador do Auth.' }, { status: 500 })
    }

    console.log('[DELETE USER] User deleted successfully')
    return NextResponse.json({ data: { success: true }, error: null })
  } catch (err) {
    console.log('[DELETE USER] Catch error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}