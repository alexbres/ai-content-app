import type { Request, Response, NextFunction } from 'express'
import { InteractionRepository } from '../models/interaction.repository.js'
import { CommentRepository } from '../models/comment.repository.js'
import { pool } from '../services/database.js'
import { resolveNumericUserIdFromReq } from '../utils/auth.js'

async function getUserInteraction(postId: number, userId?: number) {
  if (!userId) return null
  const { rows } = await pool.query<{ type: 'like' | 'dislike' | 'favorite' }>(
    'SELECT type FROM interactions WHERE user_id = $1 AND post_id = $2 LIMIT 1',
    [userId, postId]
  )
  return rows[0]?.type ?? null
}

export class InteractionController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = Number(req.params.id)
      const stats = await InteractionRepository.getStats(postId)
      const { rows } = await pool.query<{ count: string }>('SELECT COUNT(1) AS count FROM comments WHERE post_id = $1', [postId])
      const comments = Number(rows[0]?.count ?? 0)
      const currentUserId = await resolveNumericUserIdFromReq(req)
      const userInteraction = await getUserInteraction(postId, currentUserId ?? undefined)
      res.json({ likes: stats.like_count, dislikes: stats.dislike_count, comments, userInteraction })
    } catch (err) {
      next(err)
    }
  }

  static async toggleLike(req: Request, res: Response, next: NextFunction) {
    await toggleInteraction(req, res, next, 'like')
  }

  static async toggleDislike(req: Request, res: Response, next: NextFunction) {
    await toggleInteraction(req, res, next, 'dislike')
  }

  static async toggleFavorite(req: Request, res: Response, next: NextFunction) {
    await toggleInteraction(req, res, next, 'favorite')
  }
}

async function toggleInteraction(
  req: Request,
  res: Response,
  next: NextFunction,
  type: 'like' | 'dislike' | 'favorite'
) {
  try {
    const postId = Number(req.params.id)
    const userId = await resolveNumericUserIdFromReq(req)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const exists = await hasInteraction(userId, postId, type)
    if (exists) {
      await InteractionRepository.delete(userId, postId, type)
    } else {
      await InteractionRepository.upsert(userId, postId, type)
      // mutual exclusion
      if (type === 'like') await InteractionRepository.delete(userId, postId, 'dislike')
      if (type === 'dislike') await InteractionRepository.delete(userId, postId, 'like')
    }

    const stats = await InteractionRepository.getStats(postId)
    const { rows } = await pool.query<{ count: string }>('SELECT COUNT(1) AS count FROM comments WHERE post_id = $1', [postId])
    const comments = Number(rows[0]?.count ?? 0)
    const userInteraction = await getUserInteraction(postId, userId)
    res.json({ likes: stats.like_count, dislikes: stats.dislike_count, comments, userInteraction })
  } catch (err) {
    next(err)
  }
}

async function hasInteraction(userId: number, postId: number, type: 'like' | 'dislike' | 'favorite'): Promise<boolean> {
  const { rowCount } = await pool.query('SELECT 1 FROM interactions WHERE user_id = $1 AND post_id = $2 AND type = $3', [userId, postId, type])
  return (rowCount ?? 0) > 0
}


