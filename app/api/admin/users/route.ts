import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    const supabase = createServerClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'superuser' && profile.role !== 'mod')) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 })
    }

    let query = supabase
      .from('profiles')
      .select('id, username, display_name, avatar_initials, avatar_url, role, is_online, posts_count, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    if (search) {
      query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
    }

    const { data: users, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar utilizadores.' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        users: users || [],
        total: count || 0,
        page,
        limit
      },
      error: null
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
