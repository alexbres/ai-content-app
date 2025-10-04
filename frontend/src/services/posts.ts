import { z } from 'zod'
import { authedHttp, http } from './http'
import type { Paginated, PostModel, PostStatus } from '../types/auth'

const postSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  content: z.string().min(1),
  preview: z.string().nullable(),
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
} = {}): Promise<Paginated<PostModel>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.status) query.set('status', params.status)
  if (params.labels?.length) query.set('labels', params.labels.join(','))
  if (params.search) query.set('search', params.search)
  const { data } = await http.get(`/posts?${query.toString()}`)
  return paginatedSchema.parse(data)
}

export async function getPost(id: number): Promise<PostModel> {
  const { data } = await http.get(`/posts/${id}`)
  return postSchema.parse(data)
}

export async function createPost(input: CreatePostInput): Promise<PostModel> {
  const { data } = await authedHttp.post('/posts', input)
  return postSchema.parse(data)
}

export async function updatePost(id: number, input: UpdatePostInput): Promise<PostModel> {
  const { data } = await authedHttp.put(`/posts/${id}`, input)
  return postSchema.parse(data)
}

export async function archivePost(id: number): Promise<void> {
  await authedHttp.delete(`/posts/${id}`)
}



