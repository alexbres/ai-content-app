import { Router } from 'express'
import { requireAuth, extractUser, optionalAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { PostController } from '../controllers/post.controller.js'

const router = Router()

// GET /api/posts - list with filters and pagination
router.get('/', optionalAuth, PostController.list)

// GET /api/posts/:id - get one
router.get('/:id', PostController.get)

// POST /api/posts - admin only
router.post('/', requireAuth, extractUser, requireRole(['admin']), PostController.create)

// PUT /api/posts/:id - admin only
router.put('/:id', requireAuth, extractUser, requireRole(['admin']), PostController.update)

// DELETE /api/posts/:id - soft delete (admin only)
router.delete('/:id', requireAuth, extractUser, requireRole(['admin']), PostController.softDelete)

export default router


