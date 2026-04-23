import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) {
      return NextResponse.json({ banned: false })
    }

    const { data: banCheck } = await supabase
      .from('banned_users')
      .select('expires_at, reason')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!banCheck) {
      return NextResponse.json({ banned: false })
    }

    const isPermanentBan = !banCheck.expires_at
    const isActiveBan = banCheck.expires_at && new Date(banCheck.expires_at) > new Date()

    if (isPermanentBan || isActiveBan) {
      return NextResponse.json({
        banned: true,
        reason: banCheck.reason || 'A tua conta foi suspensa.',
        permanent: isPermanentBan,
        expires_at: banCheck.expires_at,
      })
    }

    return NextResponse.json({ banned: false })
  } catch (err) {
    console.error('Check ban error:', err)
    return NextResponse.json({ error: 'Erro ao verificar ban' }, { status: 500 })
  }
}