import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const session = await auth()
    const supabase = createServerClient()

    let query = supabase
      .from('profiles')
      .select('id, username, display_name, avatar_initials, avatar_url, followers_count')
      .order('followers_count', { ascending: false })
      .limit(5)

    if (session) {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', session.user.id)

      const excludeIds = [session.user.id, ...(following?.map(f => f.following_id) ?? [])]
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data: data ?? [], error: null })
  } catch {
    return NextResponse.json({ data: [], error: null })
  }
}
