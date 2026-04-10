import api from './api'
import type { Comment, ApiResponse } from '@/types'

export async function getComments(postId: string): Promise<ApiResponse<Comment[]>> {
  const { data } = await api.get(`/comments/${postId}`)
  return data
}

export async function addComment(postId: string, content: string): Promise<ApiResponse<Comment>> {
  const { data } = await api.post(`/comments/${postId}`, { content })
  return data
}

export async function deleteComment(postId: string, comment_id: string): Promise<ApiResponse<null>> {
  const { data } = await api.delete(`/comments/${postId}`, { data: { comment_id } })
  return data
}
