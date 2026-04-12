import api from './api'
import type { Comment, ApiResponse } from '@/types'

export async function getComments(postId: string): Promise<ApiResponse<Comment[]>> {
  const { data } = await api.get(`/comments/${postId}`)
  return data
}

export async function addComment(postId: string, content: string, parentId?: string): Promise<ApiResponse<Comment>> {
  const { data } = await api.post(`/comments/${postId}`, { content, parent_id: parentId ?? null })
  return data
}

export async function editComment(postId: string, commentId: string, content: string): Promise<ApiResponse<Comment>> {
  const { data } = await api.patch(`/comments/${postId}`, { comment_id: commentId, content })
  return data
}

export async function deleteComment(postId: string, commentId: string): Promise<ApiResponse<null>> {
  const { data } = await api.delete(`/comments/${postId}`, { data: { comment_id: commentId } })
  return data
}

export async function likeComment(postId: string, commentId: string): Promise<ApiResponse<{ liked: boolean; likes_count: number }>> {
  const { data } = await api.post(`/comments/${postId}/${commentId}/like`)
  return data
}
