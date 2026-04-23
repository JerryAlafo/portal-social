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

    const [reports, totalReports, announcements, totalAnnouncements, postsToday, dailyPosts, dailyLabels, reportsLast24h, monthlyRaw] = await Promise.all([
      supabase.from('reported_posts').select('id, post_id, reporter_id, reason, created_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('reported_posts').select('*', { count: 'exact', head: true }),
      supabase.from('announcements').select('id, title, content, status, created_at, pinned').order('created_at', { ascending: false }).limit(10),
      supabase.from('announcements').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', now.toISOString().slice(0, 10)),
      Promise.all([...Array(7)].map((_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
        const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString()
        const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString()
        return supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', dayStart).lte('created_at', dayEnd)
      })),
      Promise.resolve(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']),
      supabase.from('reported_posts').select('*', { count: 'exact', head: true }).gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('posts').select('created_at').gte('created_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('posts').select('category').in('category', ['geral', ' humor', 'musica', 'desporto', 'politica', 'tecnologia', 'outro']),
    ])

    const monthlyPosts: number[] = Array(30).fill(0)
    if (monthlyRaw.data) {
      monthlyRaw.data.forEach(p => {
        const postDate = new Date(p.created_at)
        const daysDiff = Math.floor((now.getTime() - postDate.getTime()) / (24 * 60 * 60 * 1000))
        const idx = 29 - daysDiff
        if (idx >= 0 && idx < 30) monthlyPosts[idx]++
      })
    }
    const monthlyLabels = Array.from({ length: 30 }, (_, i) => String(i + 1))

    const categories: Record<string, number> = { 'geral': 0, 'humor': 0, 'musica': 0, 'desporto': 0, 'politica': 0, 'tecnologia': 0, 'outro': 0 }
    if ((monthlyRaw as any).data) {
      (monthlyRaw as any).data.forEach((p: { category?: string }) => {
        const cat = p.category || 'outro'
        if (categories[cat] !== undefined) {
          categories[cat]++
        } else {
          categories.outro++
        }
      })
    }
    const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value })).filter(c => c.value > 0).slice(0, 5)

    return NextResponse.json({
      data: {
        reports: reports.data || [],
        totalReports: totalReports.count || 0,
        reportsLast24h: reportsLast24h.count || 0,
        announcements: announcements.data || [],
        totalAnnouncements: totalAnnouncements.count || 0,
        postsToday: postsToday.count || 0,
        dailyPosts: dailyPosts.map(r => r.count || 0),
        dailyLabels,
        monthlyPosts,
        monthlyLabels,
        categoryData,
        activeAnnouncements: (announcements.data || []).filter(a => a.status === 'published').length,
      },
      error: null,
    })
  } catch (err) {
    console.error('Erro ao buscar dashboard:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}