import type { Post } from '@/types'

export const mockPosts: Post[] = [
  {
    id: '1',
    author_id: 'admin-1',
    content: 'Bem-vindos ao PORTAL — a rede social criada para otakus apaixonados! Estamos agora em beta e queremos ouvir o vosso feedback. Partilhem as vossas opinioes e ajudem-nos a construir a melhor comunidade de anime e manga da lingua portuguesa.',
    category: 'Anuncio',
    image_url: null,
    likes_count: 2400,
    comments_count: 318,
    shares_count: 145,
    liked_by_me: true,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    author: { id: 'admin-1', username: 'portal_admin', display_name: 'PortalAdmin', avatar_initials: 'PO', avatar_url: null, role: 'superuser' },
  },
  {
    id: '2',
    author_id: 'user-2',
    content: "Finalmente acabei de ver Frieren: Beyond Journey's End e estou completamente destruido emocionalmente. Este anime e uma obra-prima absoluta.",
    category: 'Anime',
    image_url: null,
    likes_count: 847,
    comments_count: 124,
    shares_count: 56,
    liked_by_me: false,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60000).toISOString(),
    author: { id: 'user-2', username: 'akirafan99', display_name: 'AkiraFan99', avatar_initials: 'AK', avatar_url: null, role: 'member' },
  },
  {
    id: '3',
    author_id: 'user-3',
    content: 'Acabei o episodio 24 de Demon Slayer — Infinity Castle Arc. Precisei de parar a meio para respirar. A animacao do Ufotable neste episodio e outro nivel completamente.',
    category: 'Anime',
    image_url: null,
    likes_count: 1200,
    comments_count: 287,
    shares_count: 93,
    liked_by_me: true,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    author: { id: 'user-3', username: 'yukisenpai', display_name: 'YukiSenpai', avatar_initials: 'YS', avatar_url: null, role: 'mod' },
  },
  {
    id: '4',
    author_id: 'user-4',
    content: 'O meu cosplay da Nezuko ficou finalmente pronto! Levei 3 semanas a fazer o kimono a mao. Qual e a vossa opiniao?',
    category: 'Cosplay',
    image_url: null,
    likes_count: 523,
    comments_count: 98,
    shares_count: 41,
    liked_by_me: false,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    author: { id: 'user-4', username: 'sakurahime', display_name: 'SakuraHime', avatar_initials: 'SH', avatar_url: null, role: 'member' },
  },
  {
    id: '5',
    author_id: 'user-5',
    content: 'Acabei de ler o capitulo mais recente de One Piece. Oda-sensei continua a surpreender depois de mais de 25 anos.',
    category: 'Manga',
    image_url: null,
    likes_count: 312,
    comments_count: 67,
    shares_count: 28,
    liked_by_me: false,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    author: { id: 'user-5', username: 'naruzuki', display_name: 'NaruZuki', avatar_initials: 'NZ', avatar_url: null, role: 'member' },
  },
]

export const mockTrending = [
  { rank: 1, tag: 'DemonSlayer',     count: '4.2k publicacoes' },
  { rank: 2, tag: 'Frieren',         count: '3.8k publicacoes' },
  { rank: 3, tag: 'JujutsuKaisen',   count: '2.9k publicacoes' },
  { rank: 4, tag: 'AnimeSpring2026', count: '2.1k publicacoes' },
  { rank: 5, tag: 'Cosplay',         count: '1.7k publicacoes' },
]

export const mockSuggestions = [
  { name: 'OtakuRei',  handle: '@otakulei',  followers: '2.4k seguidores', initials: 'OR', bg: '#1a0030', color: '#e879f9' },
  { name: 'MangaKaNo', handle: '@mangakano', followers: '1.8k seguidores', initials: 'MN', bg: '#0a2015', color: '#5cfcb4' },
  { name: 'RyuKen',    handle: '@ryuken',    followers: '967 seguidores',  initials: 'RK', bg: '#1a0800', color: '#fc8c5c' },
  { name: 'NaruZuki',  handle: '@naruzuki',  followers: '743 seguidores',  initials: 'NZ', bg: '#0a0a2a', color: '#7c5cfc' },
]

export const mockEvents = [
  { date: '14 Abr · Online', dateColor: 'var(--accent2)', title: 'Viewing Party — Solo Leveling S2', interested: '128 interessados' },
  { date: '20 Abr · Lisboa', dateColor: 'var(--pink)',    title: 'Lisboa Anime Fest 2026',           interested: '342 interessados' },
]
