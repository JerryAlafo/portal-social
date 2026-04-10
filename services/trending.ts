import api from './api'
import type { TrendingTag, ApiResponse } from '@/types'

export async function getTrending(): Promise<ApiResponse<TrendingTag[]>> {
  const { data } = await api.get('/trending')
  return data
}
