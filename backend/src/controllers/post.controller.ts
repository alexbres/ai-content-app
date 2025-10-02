import type { Request, Response, NextFunction } from 'express'
import { PostRepository } from '../models/post.repository.js'
import { InteractionRepository } from '../models/interaction.repository.js'
import { CommentRepository } from '../models/comment.repository.js'
import { SubscriptionRepository } from '../models/subscription.repository.js'
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

async function ensurePremiumAccess(post: any, req: Request) {
  if (!post.is_premium) return true
  const authUser = (req as any).user as { id?: string | number } | undefined
  if (!authUser?.id) return false
  const numericUserId = typeof authUser.id === 'string' ? Number(authUser.id) : authUser.id
  if (!numericUserId) return false
  const sub = await SubscriptionRepository.findByUserId(numericUserId)
  return Boolean(sub && (sub.status === 'active' || sub.status === 'trial' || sub.status === 'past_due'))
}

export class PostController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { filters, limit, offset } = parseFilters(req)
      const page = await PostRepository.findWithFilters(filters, { limit, offset })
      const data = await Promise.all(page.data.map((p) => enrichPost(p, undefined)))
      res.json({ ...page, data })
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
      if (!body?.title || !body?.content || typeof body.author_id !== 'number') {
        return res.status(400).json({ error: 'title, content, author_id are required' })
      }
      const created = await PostRepository.create({
        title: body.title,
        content: body.content,
        preview: body.preview,
        status: body.status ?? 'draft',
        is_premium: Boolean(body.is_premium),
        labels: Array.isArray(body.labels) ? body.labels : [],
        author_id: body.author_id,
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


