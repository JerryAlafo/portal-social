import api from './api'
import type { Fanfic, ApiResponse } from '@/types'

export async function getFanfics(params?: { fandom?: string; sort?: 'recent' | 'popular' }): Promise<ApiResponse<Fanfic[]>> {
  const { data } = await api.get('/fanfics', { params })
  return data
}
