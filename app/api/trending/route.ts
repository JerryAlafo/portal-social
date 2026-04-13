import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('post_tags')
      .select('tag')
      .limit(2000)

    if (error) throw error

    const counts = new Map<string, number>()
    for (const item of data ?? []) {
      counts.set(item.tag, (counts.get(item.tag) ?? 0) + 1)
    }

    const trending = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, postCount]) => ({
        id: tag,
        tag,
        post_count: postCount,
      }))

    return NextResponse.json({ data: trending, error: null })
  } catch {
    return NextResponse.json({ data: [], error: null })
  }
}
