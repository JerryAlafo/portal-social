export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_initials: string
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  role: 'member' | 'mod' | 'superuser'
  level: number
  is_online: boolean
  posts_count: number
  followers_count: number
  following_count: number
  likes_received_count: number
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  category: string | null
  image_url: string | null
  is_spoiler?: boolean | null
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  updated_at: string
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_initials' | 'avatar_url' | 'role'>
  liked_by_me?: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  likes_count: number
  liked_by_me?: boolean
  created_at: string
  updated_at?: string
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_initials' | 'avatar_url'>
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  id: string
  created_at: string
  other_user: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_initials' | 'avatar_url' | 'is_online'>
  last_message: Pick<Message, 'content' | 'created_at' | 'sender_id'> | null
  unread_count: number
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'share' | 'mention'
  post_id: string | null
  is_read: boolean
  created_at: string
  actor: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_initials' | 'avatar_url'>
}

export interface Event {
  id: string
  title: string
  description: string | null
  date: string
  location: string | null
  image_url: string | null
  organizer_id: string | null
  interested_count: number
  going_count: number
  date_color: string | null
  created_at: string
}

export interface NewsItem {
  id: string
  title: string
  summary: string | null
  image_url: string | null
  category: string | null
  source: string | null
  published_at: string
}

export interface Fanfic {
  id: string
  title: string
  synopsis: string | null
  author_id: string
  fandom: string | null
  genre: string | null
  language: string
  cover_url: string | null
  status: 'ongoing' | 'complete' | 'hiatus'
  chapters: number
  words: number
  reads_count: number
  likes_count: number
  created_at: string
  updated_at: string
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_initials'>
}

export interface GalleryItem {
  id: string
  author_id: string
  title: string | null
  image_url: string
  category: string | null
  likes_count: number
  created_at: string
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_initials'>
}

export interface TrendingTag {
  id: string
  tag: string
  post_count: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  error: string | null
}
