import api from './api'
import type { ApiResponse } from '@/types'
import type { Profile, Post, TrendingTag } from '@/types'

interface SearchResults {
  users: Profile[]
  posts: Post[]
  tags: TrendingTag[]
}

export async function search(q: string, type: 'all' | 'users' | 'posts' | 'tags' = 'all'): Promise<ApiResponse<SearchResults>> {
  const { data } = await api.get('/search', { params: { q, type } })
  return data
}
