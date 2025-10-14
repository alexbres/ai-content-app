export type UserWithRoles = {
  sub?: string
  email?: string
  name?: string
  picture?: string
  [claim: string]: unknown
}


export type Role = 'user' | 'admin'

export interface AppUserProfile {
  id: string
  email?: string
  name?: string
  picture?: string
  roles?: Role[]
}

export type PostStatus = 'draft' | 'published' | 'archived'

export interface PostModel {
  id: number
  title: string
  content: string
  preview: string | null
  image_id?: string | null
  status: PostStatus
  is_premium: boolean
  labels: string[]
  author_id: number
  created_at: string
  updated_at: string
  like_count?: number
  dislike_count?: number
  comment_count?: number
  user_interaction?: 'like' | 'dislike' | 'favorite' | null
}

export interface Paginated<T> {
  posts: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

