import { http } from './http'

export interface PostsFilters {
  search: string
  labels: string[]
  favorites: boolean
  premium: boolean
}

export type FetchPostsResponse<T> = {
  posts: T[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const fetchPosts = async <T = any>(filters: PostsFilters, page = 1, limit = 12): Promise<FetchPostsResponse<T>> => {
  const query = new URLSearchParams()
  query.set('page', String(page))
  query.set('limit', String(limit))
  if (filters.search) query.set('search', filters.search)
  if (filters.labels?.length) query.set('labels', filters.labels.join(','))
  if (filters.favorites) query.set('favorites', '1')
  if (filters.premium) query.set('premium', '1')
  const { data } = await http.get(`/posts?${query.toString()}`)
  return data as FetchPostsResponse<T>
}


