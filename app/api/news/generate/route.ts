import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface GeneratedNews {
  title: string
  summary: string
  category: string
  source: string
  published_at: string
}

export async function POST() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const news = await generateNewsFromAI()
    
    const newsWithId = news.map((n, i) => ({
      ...n,
      id: `ai-${Date.now()}-${i}`,
      reads_count: 0,
      pinned: false,
      author: { username: 'PORTAL', role: 'superuser' }
    }))
    
    return NextResponse.json({ 
      data: { generatedItems: newsWithId, generated: newsWithId.length, total: news.length },
      error: null 
    })
  } catch (err) {
    console.error('Generate news error:', err)
    return NextResponse.json({ error: 'Erro ao gerar notícias.' }, { status: 500 })
  }
}

async function generateNewsFromAI(): Promise<GeneratedNews[]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY não configurada')
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'PORTAL News Generator',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content: `Eres un redactor de noticias de anime/manga. Genera 4 noticias realistas sobre anime, manga, industria otaku y eventos japoneses.
          
Responde SOLO con JSON en este formato exacto, sin texto adicional:
[
  {
    "title": "titulo da noticia em portugues (max 120 caracteres)",
    "summary": "resumen de 2-3 linhas em portugues",
    "category": "Anime" ou "Manga" ou "Industria" ou "Eventos",
    "source": "Crunchyroll" ou "MyAnimeList" ou "ANN" ou "Anime News Network" ou "Polygon" ou "GameSpot" ou "Nintendo Life" ou "Gematsu"
  }
]

Idioma: Portugues de Portugal.
Fecha actual: ${new Date().toLocaleDateString('pt-PT')}`
        },
        {
          role: 'user', 
          content: 'Genera 4 noticias actuales sobre anime y manga para una comunidad otaku portuguesa.'
        }
      ],
      max_tokens: 800,
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Resposta vazia da IA')
  }

  const cleaned = content.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(cleaned) as GeneratedNews[]

  return parsed.map(n => ({
    ...n,
    published_at: new Date().toISOString(),
  }))
}
