import { z } from 'zod'
import { authedHttp, http } from './http'
import type { Paginated, PostModel, PostStatus } from '../types/auth'

const postSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  content: z.string().min(1),
  preview: z.string().nullable(),
  image_id: z.string().uuid().nullable().optional(),
  status: z.union([z.literal('draft'), z.literal('published'), z.literal('archived')]),
  is_premium: z.boolean(),
  labels: z.array(z.string()),
  author_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  like_count: z.number().optional(),
  dislike_count: z.number().optional(),
  comment_count: z.number().optional(),
  user_interaction: z.union([z.literal('like'), z.literal('dislike'), z.literal('favorite'), z.null()]).optional(),
})

const paginatedSchema = z.object({
  posts: z.array(postSchema),
  pagination: z.object({ page: z.number(), limit: z.number(), total: z.number(), pages: z.number() }),
})

export type CreatePostInput = {
  title: string
  content: string
  preview?: string | null
  image?: File | null
  status?: PostStatus
  is_premium?: boolean
  labels?: string[]
  author_id?: number
}

export type UpdatePostInput = Partial<CreatePostInput>

export async function listPosts(params: {
  page?: number
  limit?: number
  status?: PostStatus
  labels?: string[]
  search?: string
  favorites?: boolean
  premium?: boolean
} = {}): Promise<Paginated<PostModel>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.status) query.set('status', params.status)
  if (params.labels?.length) query.set('labels', params.labels.join(','))
  if (params.search) query.set('search', params.search)
  if (params.favorites) query.set('favorites', '1')
  if (params.premium) query.set('premium', '1')
  const { data } = await http.get(`/posts?${query.toString()}`)
  return paginatedSchema.parse(data)
}

export async function getPost(id: number): Promise<PostModel> {
  const { data } = await http.get(`/posts/${id}`)
  return postSchema.parse(data)
}

export async function createPost(input: CreatePostInput): Promise<PostModel> {
  const hasFile = Boolean(input.image)
  if (hasFile) {
    const form = new FormData()
    form.set('title', input.title)
    form.set('content', input.content)
    if (input.preview != null) form.set('preview', input.preview)
    if (input.status) form.set('status', input.status)
    if (input.is_premium != null) form.set('is_premium', String(input.is_premium))
    if (input.labels?.length) input.labels.forEach((l) => form.append('labels', l))
    if (input.author_id != null) form.set('author_id', String(input.author_id))
    form.append('image', input.image as Blob)
    const { data } = await authedHttp.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return postSchema.parse(data)
  }
  const { data } = await authedHttp.post('/posts', input)
  return postSchema.parse(data)
}

export async function updatePost(id: number, input: UpdatePostInput & { image?: File | null }): Promise<PostModel> {
  const hasFile = Boolean((input as any).image)
  if (hasFile) {
    const form = new FormData()
    if (input.title) form.set('title', input.title)
    if (input.content) form.set('content', input.content)
    if (input.preview != null) form.set('preview', input.preview)
    if (input.status) form.set('status', input.status)
    if (input.is_premium != null) form.set('is_premium', String(input.is_premium))
    if (input.labels?.length) input.labels.forEach((l) => form.append('labels', l))
    if (input.author_id != null) form.set('author_id', String(input.author_id))
    form.append('image', (input as any).image as Blob)
    const { data } = await authedHttp.put(`/posts/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return postSchema.parse(data)
  }
  const { data } = await authedHttp.put(`/posts/${id}`, input)
  return postSchema.parse(data)
}

export async function archivePost(id: number): Promise<void> {
  await authedHttp.delete(`/posts/${id}`)
}


// Interactions & Comments

export type InteractionStats = {
  likes: number
  dislikes: number
  comments: number
  userInteraction: 'like' | 'dislike' | 'favorite' | null
}

export type CommentResponse = {
  id: number
  content: string
  created_at: string
  user: {
    name?: string
    avatar_url?: string
  }
}

export async function getInteractions(postId: number): Promise<InteractionStats> {
  const { data } = await http.get(`/posts/${postId}/interactions`)
  return data as InteractionStats
}

export async function toggleLike(postId: number): Promise<InteractionStats> {
  const { data } = await authedHttp.post(`/posts/${postId}/like`)
  return data as InteractionStats
}

export async function toggleDislike(postId: number): Promise<InteractionStats> {
  const { data } = await authedHttp.post(`/posts/${postId}/dislike`)
  return data as InteractionStats
}

export async function toggleFavorite(postId: number): Promise<InteractionStats> {
  const { data } = await authedHttp.post(`/posts/${postId}/favorite`)
  return data as InteractionStats
}

export async function listComments(postId: number, opts: { page?: number; limit?: number } = {}): Promise<CommentResponse[]> {
  const query = new URLSearchParams()
  if (opts.page) query.set('page', String(opts.page))
  if (opts.limit) query.set('limit', String(opts.limit))
  const { data } = await http.get(`/posts/${postId}/comments?${query.toString()}`)
  return data as CommentResponse[]
}

export async function createComment(postId: number, content: string): Promise<CommentResponse> {
  const { data } = await authedHttp.post(`/posts/${postId}/comments`, { content })
  return data as CommentResponse
}

export async function deleteComment(commentId: number): Promise<void> {
  await authedHttp.delete(`/comments/${commentId}`)
}



