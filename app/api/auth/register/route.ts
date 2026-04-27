import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, username, display_name } = body ?? {}

  if (!email || !password || !username || !display_name) {
    return NextResponse.json(
      { error: 'Todos os campos são obrigatórios.' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  const { data: existingUsername, error: usernameError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (usernameError) {
    return NextResponse.json(
      { error: 'Erro ao verificar nome de utilizador.' },
      { status: 500 }
    )
  }

  if (existingUsername) {
    return NextResponse.json(
      { error: 'Nome de utilizador já está em utilização.' },
      { status: 409 }
    )
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name,
    },
  })

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? 'Não foi possível criar a conta.' },
      { status: 500 }
    )
  }

  const avatar_initials = display_name
    .trim()
    .slice(0, 2)
    .toUpperCase()

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    username,
    display_name,
    avatar_initials,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id).catch(() => {})
    return NextResponse.json(
      { error: 'Não foi possível criar o perfil do utilizador.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
