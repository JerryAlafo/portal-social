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

    const supabase = createServerClient()

    const body = await request.json()
    console.log('[PATCH /api/profile] body:', body)

    // Whitelist updatable fields
    const allowed = ['username', 'display_name', 'bio', 'location', 'website', 'avatar_url', 'cover_url']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (!(key in body)) continue

      const value = body[key]
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (key === 'bio' || key === 'location' || key === 'website' || key === 'cover_url') {
          updates[key] = trimmed === '' ? null : trimmed
        } else {
          updates[key] = trimmed
        }
      } else {
        updates[key] = value
      }
    }

    if (updates.username) {
      const { data: existingUser, error: existingError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', session.user.id)
        .maybeSingle()

      if (existingError) throw existingError
      if (existingUser) {
        return NextResponse.json({ error: 'Nome de utilizador já está em utilização.' }, { status: 409 })
      }
    }

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })

    if (updates.display_name && typeof updates.display_name === 'string' && !updates.avatar_initials) {
      const words = updates.display_name.trim().split(/\s+/)
      updates.avatar_initials = words.map(w => w[0]).slice(0, 2).join('').toUpperCase()
    }

    if (updates.bio && typeof updates.bio === 'string' && updates.bio.length > 160)
      return NextResponse.json({ error: 'Bio não pode exceder 160 caracteres.' }, { status: 400 })

    console.log('[PATCH /api/profile] userId:', session.user.id, 'updates:', updates)

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, ...updates }, { onConflict: 'id' })
      .select()
      .single()

    console.log('[PATCH /api/profile] error:', error, 'data:', data)
    if (error) throw error
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar perfil.' }, { status: 500 })
  }
}
