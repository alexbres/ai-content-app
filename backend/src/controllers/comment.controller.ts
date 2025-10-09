import type { Request, Response, NextFunction } from 'express'
import { CommentRepository } from '../models/comment.repository.js'
import { resolveNumericUserIdFromReq, getUserRolesFromReq } from '../utils/auth.js'
import { pool } from '../services/database.js'

export class CommentController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = Number(req.params.id)
      const page = typeof req.query.page === 'number' ? req.query.page : Number(req.query.page)
      const limit = typeof req.query.limit === 'number' ? req.query.limit : Number(req.query.limit)
      const data = await CommentRepository.findByPostId(postId, { limit, offset: (Math.max(1, page) - 1) * limit })
      // newest first (repository returns ASC by created_at; reverse here for response requirement)
      const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const mapped = sorted.map((c) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user: { name: (c as any).user?.name ?? null, avatar_url: (c as any).user?.avatar_url ?? null },
      }))
      res.json(mapped)
    } catch (err) {
      next(err)
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = Number(req.params.id)
      const userId = await resolveNumericUserIdFromReq(req)
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      const content = String((req.body as any).content || '')
      if (content.length < 1 || content.length > 1000) return res.status(400).json({ error: 'ValidationError' })
      const created = await CommentRepository.create({ post_id: postId, user_id: userId, content })
      const userRow = await pool.query<{ name: string | null; avatar_url: string | null }>('SELECT name, avatar_url FROM users WHERE id = $1', [userId])
      res.status(201).json({
        id: created.id,
        content: created.content,
        created_at: created.created_at,
        user: { name: userRow.rows[0]?.name ?? null, avatar_url: userRow.rows[0]?.avatar_url ?? null },
      })
    } catch (err) {
      next(err)
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const userId = await resolveNumericUserIdFromReq(req)
      if (!userId) return res.status(401).json({ error: 'Unauthorized' })
      const { rows } = await pool.query<{ user_id: number }>('SELECT user_id FROM comments WHERE id = $1', [id])
      const ownerId = rows[0]?.user_id
      if (!ownerId) return res.status(404).json({ error: 'Not Found' })
      const roles = getUserRolesFromReq(req)
      const isOwner = ownerId === userId
      const isAdmin = roles.includes('admin')
      if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Insufficient permissions' })
      const ok = await CommentRepository.delete(id)
      if (!ok) return res.status(404).json({ error: 'Not Found' })
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}


