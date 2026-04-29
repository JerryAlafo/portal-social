import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const supabase = createServerClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'superuser' && profile.role !== 'mod')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const body = await request.json()
    const { report_id, action } = body

    if (!report_id || !action) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const { data: report } = await supabase
      .from('reported_posts')
      .select('id, post_id, status')
      .eq('id', report_id)
      .single()

    if (!report) {
      return NextResponse.json({ error: 'Denúncia não encontrada.' }, { status: 404 })
    }

    if (report.status !== 'pending') {
      return NextResponse.json({ error: 'Denúncia já foi processada.' }, { status: 400 })
    }

    if (action === 'dismiss') {
      const { error } = await supabase
        .from('reported_posts')
        .update({ status: 'dismissed', reviewed_by: session.user.id })
        .eq('id', report_id)

      if (error) throw error

      return NextResponse.json({ data: { status: 'dismissed' }, error: null })
    }

    if (action === 'delete_post') {
      const { error: deletePostError } = await supabase
        .from('posts')
        .delete()
        .eq('id', report.post_id)

      if (deletePostError) throw deletePostError

      const { error: updateReportError } = await supabase
        .from('reported_posts')
        .update({ status: 'deleted', reviewed_by: session.user.id })
        .eq('id', report_id)

      if (updateReportError) throw updateReportError

      return NextResponse.json({ data: { status: 'deleted' }, error: null })
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Erro ao processar denúncia.' }, { status: 500 })
  }
}
