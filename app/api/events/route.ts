import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
      .limit(10)

    if (error) throw error

    return NextResponse.json({ data: data ?? [], error: null })
  } catch (err) {
    console.error('Events API error:', err)
    return NextResponse.json({ data: [], error: null })
  }
}
