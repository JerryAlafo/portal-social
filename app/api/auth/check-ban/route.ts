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

    console.log('Checking ban for email:', email)

    // Find user by email in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    const user = authData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    console.log('Auth user lookup:', { user, authError })

    if (!user) {
      console.log('User not found')
      return NextResponse.json({ banned: false })
    }

    const { data: banChecks, error: banError } = await supabase
      .from('banned_users')
      .select('expires_at, reason')
      .eq('user_id', user.id)

    console.log('Ban check:', { banChecks, banError })

    if (!banChecks || banChecks.length === 0) {
      return NextResponse.json({ banned: false })
    }

    // Check if any ban is active
    const activeBan = banChecks.find(ban => {
      const isPermanent = !ban.expires_at
      const isActive = ban.expires_at && new Date(ban.expires_at) > new Date()
      return isPermanent || isActive
    })

    if (activeBan) {
      const isPermanentBan = !activeBan.expires_at
      return NextResponse.json({
        banned: true,
        reason: activeBan.reason || 'A tua conta foi suspensa.',
        permanent: isPermanentBan,
        expires_at: activeBan.expires_at,
      })
    }

    return NextResponse.json({ banned: false })
  } catch (err) {
    console.error('Check ban error:', err)
    return NextResponse.json({ error: 'Erro ao verificar ban' }, { status: 500 })
  }
}