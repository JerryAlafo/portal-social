import api from './api'
import type { GalleryItem, ApiResponse } from '@/types'

export async function getGallery(category?: string): Promise<ApiResponse<GalleryItem[]>> {
  const { data } = await api.get('/gallery', { params: category ? { category } : undefined })
  return data
}
