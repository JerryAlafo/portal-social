import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar perfil.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await request.json()

    // Whitelist updatable fields
    const allowed = ['display_name', 'bio', 'location', 'website', 'avatar_url', 'cover_url']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })

    if (updates.bio && typeof updates.bio === 'string' && updates.bio.length > 160)
      return NextResponse.json({ error: 'Bio não pode exceder 160 caracteres.' }, { status: 400 })

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar perfil.' }, { status: 500 })
  }
}
