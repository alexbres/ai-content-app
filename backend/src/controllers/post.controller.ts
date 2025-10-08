import type { Request, Response, NextFunction } from 'express'
import { PostRepository } from '../models/post.repository.js'
import { InteractionRepository } from '../models/interaction.repository.js'
import { CommentRepository } from '../models/comment.repository.js'
import { SubscriptionRepository } from '../models/subscription.repository.js'
import { UserRepository } from '../models/user.repository.js'
import { pool } from '../services/database.js'
import type { PostFilters } from '../utils/filtering.js'

function parseFilters(req: Request): { filters: PostFilters; limit?: number; offset?: number } {
  const { limit, offset, status, label, labels, author_id, q, is_premium } = req.query
  const parsed: PostFilters = {
    status: typeof status === 'string' ? (status as any) : undefined,
    label: typeof label === 'string' ? label : undefined,
    labels: typeof labels === 'string' ? labels.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    is_premium: typeof is_premium === 'string' ? is_premium === 'true' : undefined,
    author_id: typeof author_id === 'string' ? Number(author_id) : undefined,
    q: typeof q === 'string' ? q : undefined,
  }
  return {
    filters: parsed,
    limit: typeof limit === 'string' ? Number(limit) : undefined,
    offset: typeof offset === 'string' ? Number(offset) : undefined,
  }
}

async function enrichPost(post: any, userId?: number) {
  const stats = await InteractionRepository.getStats(post.id)
  const enriched = { ...post, ...stats }
  // Optionally set user_interaction later (requires dedicated query; skipping for brevity)
  return enriched
}

async function resolveNumericUserIdFromReq(req: Request): Promise<number | null> {
  const u = (req as any).user as { id?: string | number } | undefined
  if (!u?.id) return null
  if (typeof u.id === 'number') return u.id
  const auth0Id = String(u.id)
  const user = await UserRepository.findByAuth0Id(auth0Id)
  return user?.id ?? null
}

async function ensurePremiumAccess(post: any, req: Request) {
  if (!post.is_premium) return true
  const numericUserId = await resolveNumericUserIdFromReq(req)
  if (!numericUserId) return false
  const sub = await SubscriptionRepository.findByUserId(numericUserId)
  return Boolean(sub && (sub.status === 'active' || sub.status === 'past_due' || sub.plan === 'trial'))
}

export class PostController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      // New query contract
      // interface PostsQuery { page?: number; limit?: number; labels?: string[]; search?: string; favorites?: boolean; premium?: boolean }

      const pageParam = typeof req.query.page === 'string' ? Number(req.query.page) : undefined
      const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined
      const labelsParam = typeof req.query.labels === 'string' ? req.query.labels.split(',').map((s) => s.trim()).filter(Boolean) : undefined
      const searchParam = typeof req.query.search === 'string' ? req.query.search : undefined
      const favoritesOnly = req.query.favorites === 'true'
      const premiumOnly = req.query.premium === 'true'

      const limit = Math.max(1, Math.min(limitParam ?? 20, 100))
      const pageNum = Math.max(1, pageParam ?? 1)
      const offset = (pageNum - 1) * limit

      const { filters } = parseFilters(req)
      filters.labels = labelsParam ?? filters.labels
      filters.q = searchParam ?? filters.q
      if (premiumOnly) filters.is_premium = true

      // base list
      const page = await PostRepository.findWithFilters(filters, { limit, offset })
      let data = await Promise.all(page.data.map((p) => enrichPost(p)))

      // favorites filter requires auth user
      if (favoritesOnly) {
        const numericUserId = await resolveNumericUserIdFromReq(req)
        if (!numericUserId) {
          return res.status(401).json({ error: 'Unauthorized' })
        }
        const ids = data.map((p) => p.id)
        if (ids.length) {
          const { rows } = await pool.query<{ post_id: number }>(
            `SELECT post_id FROM interactions WHERE user_id = $1 AND type = 'favorite' AND post_id = ANY($2::int[])`,
            [numericUserId, ids]
          )
          const favSet = new Set(rows.map((r) => r.post_id))
          data = data.filter((p) => favSet.has(p.id))
        } else {
          data = []
        }
      }

      // If premiumOnly requested, enforce premium subscription
      if (premiumOnly) {
        const ok = await (async () => {
          // check subscription for current user
          const numericUserId = await resolveNumericUserIdFromReq(req)
          if (!numericUserId) return false
          const sub = await SubscriptionRepository.findByUserId(numericUserId)
          return Boolean(sub && (sub.status === 'active' || sub.status === 'past_due' || sub.plan === 'trial'))
        })()
        if (!ok) return res.status(402).json({ error: 'Payment Required' })
      }

      res.json({
        posts: data,
        pagination: {
          page: pageNum,
          limit,
          total: page.total,
          pages: Math.max(1, Math.ceil(page.total / limit)),
        },
      })
    } catch (err) {
      next(err)
    }
  }

  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const post = await PostRepository.findById(id)
      if (!post) return res.status(404).json({ error: 'Not Found' })
      const hasAccess = await ensurePremiumAccess(post, req)
      if (!hasAccess) return res.status(402).json({ error: 'Payment Required' })
      const enriched = await enrichPost(post)
      res.json(enriched)
    } catch (err) {
      next(err)
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as Partial<Parameters<typeof PostRepository.create>[0]>
      if (!body?.title || !body?.content) {
        return res.status(400).json({ error: 'title and content are required' })
      }
      // Derive author_id from authenticated user if not provided
      let authorId = typeof body.author_id === 'number' ? body.author_id : null
      if (!authorId) {
        const numericUserId = await resolveNumericUserIdFromReq(req)
        if (!numericUserId) return res.status(401).json({ error: 'Unauthorized' })
        authorId = numericUserId
      }
      const created = await PostRepository.create({
        title: body.title,
        content: body.content,
        preview: body.preview,
        status: body.status ?? 'draft',
        is_premium: Boolean(body.is_premium),
        labels: Array.isArray(body.labels) ? body.labels : [],
        author_id: authorId!,
      })
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const updated = await PostRepository.update(id, req.body)
      if (!updated) return res.status(404).json({ error: 'Not Found' })
      res.json(updated)
    } catch (err) {
      next(err)
    }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const updated = await PostRepository.update(id, { status: 'archived' } as any)
      if (!updated) return res.status(404).json({ error: 'Not Found' })
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}


