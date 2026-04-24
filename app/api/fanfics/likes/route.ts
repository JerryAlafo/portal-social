import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ data: { likedFanficIds: [] }, error: null })

    const supabase = createServerClient()

    const { data: likes, error } = await supabase
      .from('fanfic_likes')
      .select('fanfic_id')
      .eq('user_id', session.user.id)

    if (error) throw error

    const likedFanficIds = likes?.map(l => l.fanfic_id) || []
    return NextResponse.json({ data: { likedFanficIds }, error: null })
  } catch (err) {
    console.error('Erro ao buscar likes:', err)
    return NextResponse.json({ data: { likedFanficIds: [] }, error: null })
  }
}