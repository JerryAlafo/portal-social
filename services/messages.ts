import api from './api'
import type { Conversation, Message, ApiResponse } from '@/types'

export async function getConversations(): Promise<ApiResponse<Conversation[]>> {
  const { data } = await api.get('/conversations')
  return data
}

export async function getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
  const { data } = await api.get(`/conversations/${conversationId}/messages`)
  return data
}

export async function sendMessage(conversationId: string, content: string): Promise<ApiResponse<Message>> {
  const { data } = await api.post(`/conversations/${conversationId}/messages`, { content })
  return data
}
