import api from './api'
import type { Profile, ApiResponse } from '@/types'

export async function getMyProfile(): Promise<ApiResponse<Profile>> {
  const { data } = await api.get('/profile')
  return data
}

export async function updateProfile(updates: Partial<Pick<Profile,
  'display_name' | 'bio' | 'location' | 'website' | 'avatar_url' | 'cover_url'
>>): Promise<ApiResponse<Profile>> {
  const { data } = await api.patch('/profile', updates)
  return data
}
