import api from './api'
import type { NewsItem, ApiResponse } from '@/types'

export async function getNews(category?: string): Promise<ApiResponse<NewsItem[]>> {
  const { data } = await api.get('/news', { params: category ? { category } : undefined })
  return data
}
