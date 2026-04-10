import api from './api'
import type { Event, ApiResponse } from '@/types'

export async function getEvents(): Promise<ApiResponse<Event[]>> {
  const { data } = await api.get('/events')
  return data
}
