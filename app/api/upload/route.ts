import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'

const BUCKETS = ['avatars', 'covers', 'posts', 'gallery'] as const
type Bucket = typeof BUCKETS[number]

const MAX_SIZE: Record<Bucket, number> = {
  avatars: 5  * 1024 * 1024,  // 5 MB
  covers:  8  * 1024 * 1024,  // 8 MB
  posts:   10 * 1024 * 1024,  // 10 MB
  gallery: 10 * 1024 * 1024,  // 10 MB
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const formData = await request.formData()
    const file    = formData.get('file')   as File | null
    const bucket  = formData.get('bucket') as string | null

    if (!file)                              return NextResponse.json({ error: 'Nenhum ficheiro enviado.'                             }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG, WebP ou GIF.'        }, { status: 400 })
    if (!bucket || !BUCKETS.includes(bucket as Bucket))
                                            return NextResponse.json({ error: 'Bucket inválido.'                                    }, { status: 400 })

    const maxBytes = MAX_SIZE[bucket as Bucket]
    if (file.size > maxBytes)               return NextResponse.json({ error: `Ficheiro demasiado grande. Máximo ${maxBytes / 1024 / 1024} MB.` }, { status: 400 })

    const supabase = createServerClient()

    // Path: {user_id}/{timestamp}.{ext}  — user_id is the first folder so Storage policies work
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${session.user.id}/${Date.now()}.${ext}`

    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({ data: { url: publicUrl }, error: null }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro ao fazer upload.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
