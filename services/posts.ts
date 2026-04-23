import api from './api'
import type { Post, PaginatedResponse, ApiResponse } from '@/types'
import type { AxiosError } from 'axios'

export async function getFeed(page = 1, limit = 20, category?: string, filter?: string): Promise<PaginatedResponse<Post>> {
  const params: Record<string, unknown> = { page, limit }
  if (filter) {
    params.filter = filter
  } else if (category && category !== 'Tudo') {
    params.category = category
  }
  const { data } = await api.get('/feed', { params })
  return data
}

export async function createPost(payload: {
  content: string
  category?: string
  image_url?: string
  is_spoiler?: boolean
}): Promise<ApiResponse<Post>> {
  try {
    const { data } = await api.post('/feed', payload)
    return data
  } catch (err) {
    const axiosErr = err as AxiosError<{ error?: string }>
    const message = axiosErr.response?.data?.error || 'Erro ao criar publicação.'
    return { data: null, error: message }
  }
}

export async function deletePost(id: string): Promise<ApiResponse<null>> {
  const { data } = await api.delete(`/posts/${id}`)
  return data
}

export async function toggleLike(postId: string): Promise<ApiResponse<{ liked: boolean }>> {
  const { data } = await api.post(`/posts/${postId}/like`)
  return data
}
