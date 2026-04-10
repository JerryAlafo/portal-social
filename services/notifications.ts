import api from './api'
import type { Notification, ApiResponse } from '@/types'

export async function getNotifications(): Promise<ApiResponse<Notification[]>> {
  const { data } = await api.get('/notifications')
  return data
}

export async function markAllAsRead(): Promise<ApiResponse<null>> {
  const { data } = await api.patch('/notifications')
  return data
}
