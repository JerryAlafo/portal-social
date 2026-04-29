import api from './api'
import type { Profile, ApiResponse } from '@/types'

export async function getFollowing(): Promise<ApiResponse<Profile[]>> {
  const { data } = await api.get('/following')
  return data
}

export async function toggleFollow(user_id: string): Promise<ApiResponse<{ following: boolean }>> {
  const { data } = await api.post('/following', { user_id })
  return data
}
