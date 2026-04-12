import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('trending_tags')
      .select('id, tag, post_count')
      .order('post_count', { ascending: false })
      .limit(12)

    if (error) throw error

    return NextResponse.json({ data: data ?? [], error: null })
  } catch {
    return NextResponse.json({ data: [], error: null })
  }
}
