import api from './api'
import type { Profile, ApiResponse } from '@/types'

export async function getSuggestions(): Promise<ApiResponse<Profile[]>> {
  const { data } = await api.get('/suggestions')
  return data
}
