import { Router } from 'express'
import { PostRepository } from '../models/post.repository.js'
import { requireAuth, extractUser } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import type { PostFilters } from '../utils/filtering.js'

const router = Router()

// GET /api/posts - list with filters and pagination
router.get('/', async (req, res, next) => {
  try {
    const { limit, offset, status, label, author_id, q } = req.query
    const filters: PostFilters = {
      status: typeof status === 'string' ? (status as any) : undefined,
      label: typeof label === 'string' ? label : undefined,
      author_id: typeof author_id === 'string' ? Number(author_id) : undefined,
      q: typeof q === 'string' ? q : undefined,
    }
    const page = await PostRepository.findWithFilters(filters, {
      limit: typeof limit === 'string' ? Number(limit) : undefined,
      offset: typeof offset === 'string' ? Number(offset) : undefined,
    })
    res.json(page)
  } catch (err) {
    next(err)
  }
})

// GET /api/posts/:id - get one
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const post = await PostRepository.findById(id)
    if (!post) return res.status(404).json({ error: 'Not Found' })
    res.json(post)
  } catch (err) {
    next(err)
  }
})

// POST /api/posts - admin only
router.post('/', requireAuth, extractUser, requireRole(['admin']), async (req, res, next) => {
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
})

// PUT /api/posts/:id - admin only
router.put('/:id', requireAuth, extractUser, requireRole(['admin']), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const updated = await PostRepository.update(id, req.body)
    if (!updated) return res.status(404).json({ error: 'Not Found' })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/posts/:id - soft delete (admin only)
router.delete('/:id', requireAuth, extractUser, requireRole(['admin']), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    // soft delete: set status to archived
    const updated = await PostRepository.update(id, { status: 'archived' } as any)
    if (!updated) return res.status(404).json({ error: 'Not Found' })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router


