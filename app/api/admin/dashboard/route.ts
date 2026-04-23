import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const supabase = createServerClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'superuser' && profile.role !== 'mod')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const { data: reports, error: reportsError } = await supabase
      .from('reported_posts')
      .select('id, post_id, reporter_id, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (reportsError) {
      console.error('Erro ao buscar reports:', reportsError)
    }

    const { count: totalReports } = await supabase
      .from('reported_posts')
      .select('*', { count: 'exact', head: true })

    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select('id, title, content, status, created_at, pinned')
      .order('created_at', { ascending: false })
      .limit(10)

    if (announcementsError) {
      console.error('Erro ao buscar anúncios:', announcementsError)
    }

    const { count: totalAnnouncements } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })

    const { count: postsToday } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', now.toISOString().slice(0, 10))

    const dailyPosts: number[] = []
    const dailyLabels: string[] = []
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString()
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString()

      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)

      dailyPosts.push(count || 0)

      const dayOfWeek = date.getDay()
      dailyLabels.push(dayNames[dayOfWeek])
    }

    // Monthly data for area chart (last 30 days)
    const monthlyPosts: number[] = []
    const monthlyLabels: string[] = []

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString()
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString()

      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)

      monthlyPosts.push(count || 0)
      monthlyLabels.push(date.getDate().toString())
    }

    // Category distribution
    const { data: allPosts } = await supabase
      .from('posts')
      .select('category')

    const categories: Record<string, number> = {}
    if (allPosts) {
      allPosts.forEach(p => {
        const cat = p.category || 'Sem categoria'
        categories[cat] = (categories[cat] || 0) + 1
      })
    }

    const categoryData = Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    const today = new Date()
    const last24h = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const { count: reportsLast24h } = await supabase
      .from('reported_posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24h.toISOString())

    return NextResponse.json({
      data: {
        reports: reports || [],
        totalReports: totalReports || 0,
        reportsLast24h: reportsLast24h || 0,
        announcements: announcements || [],
        totalAnnouncements: totalAnnouncements || 0,
        postsToday: postsToday || 0,
        dailyPosts,
        dailyLabels,
        monthlyPosts,
        monthlyLabels,
        categoryData,
        activeAnnouncements: (announcements || []).filter(a => a.status === 'published').length,
      },
      error: null,
    })
  } catch (err) {
    console.error('Erro ao buscar dashboard:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}