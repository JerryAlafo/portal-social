import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const type = searchParams.get('type') ?? 'all'

    if (!q) return NextResponse.json({ data: { users: [], posts: [], tags: [] }, error: null })

    const supabase = createServerClient()
    const results: { users: unknown[]; posts: unknown[]; tags: unknown[] } = { users: [], posts: [], tags: [] }

    if (type === 'all' || type === 'users') {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_initials, avatar_url, role, followers_count')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(10)
      results.users = data ?? []
    }

    if (type === 'all' || type === 'posts') {
      const { data } = await supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_initials, avatar_url)')
        .ilike('content', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(10)
      results.posts = data ?? []
    }

    if (type === 'all' || type === 'tags') {
      const { data } = await supabase
        .from('trending_tags')
        .select('id, tag, post_count')
        .ilike('tag', `%${q}%`)
        .order('post_count', { ascending: false })
        .limit(10)
      results.tags = data ?? []
    }

    return NextResponse.json({ data: results, error: null })
  } catch {
    return NextResponse.json({ error: 'Erro ao pesquisar.' }, { status: 500 })
  }
}
