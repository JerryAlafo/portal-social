import api from './api'
import type { Profile, ApiResponse } from '@/types'

export async function getUserProfile(id: string): Promise<ApiResponse<Profile & { followed_by_me: boolean }>> {
  const { data } = await api.get(`/users/${id}`)
  return data
}
