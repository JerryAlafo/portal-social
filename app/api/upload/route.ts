import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const BUCKETS = ['avatars', 'covers', 'posts', 'gallery'] as const
type Bucket = typeof BUCKETS[number]

const MAX_SIZE: Record<Bucket, number> = {
  avatars: 5  * 1024 * 1024,
  covers:  8  * 1024 * 1024,
  posts:   10 * 1024 * 1024,
  gallery: 10 * 1024 * 1024,
}

const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOCS = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/epub+zip']

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const formData = await request.formData()
    const file    = formData.get('file')   as File | null
    const bucket  = formData.get('bucket') as string | null
    const type    = formData.get('type')   as string | null

    if (!file) return NextResponse.json({ error: 'Nenhum ficheiro enviado.' }, { status: 400 })
    if (!bucket || !BUCKETS.includes(bucket as Bucket)) return NextResponse.json({ error: 'Bucket inválido.' }, { status: 400 })

    const allowed = type === 'document' ? ALLOWED_DOCS : ALLOWED_IMAGES
    if (!allowed.includes(file.type)) {
      const hint = type === 'document' ? 'Use PDF, DOC, DOCX, TXT ou EPUB.' : 'Use JPG, PNG, WebP ou GIF.'
      return NextResponse.json({ error: `Formato inválido. ${hint}` }, { status: 400 })
    }

    const maxBytes = MAX_SIZE[bucket as Bucket]
    if (file.size > maxBytes) return NextResponse.json({ error: `Ficheiro demasiado grande. Máximo ${maxBytes / 1024 / 1024} MB.` }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
    const path = `${session.user.id}/${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({ data: { url: publicUrl, name: file.name, size: file.size, type: file.type }, error: null }, { status: 201 })
  } catch (e: unknown) {
    console.error('Upload error:', e)
    const msg = e instanceof Error ? e.message : 'Erro ao fazer upload.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}