import { Router } from 'express'
import multer from 'multer'
import { requireAuth, extractUser, optionalAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { PostController } from '../controllers/post.controller.js'
import { validate } from '../middleware/validate.js'
import Joi from 'joi'

const router = Router()

// GET /api/posts - list with filters and pagination
const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  labels: Joi.string().optional(), // comma-separated handled in controller
  search: Joi.string().max(200).optional(),
  favorites: Joi.boolean().truthy('true').falsy('false').optional(),
  premium: Joi.boolean().truthy('true').falsy('false').optional(),
  // legacy
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  label: Joi.string().optional(),
  author_id: Joi.number().integer().optional(),
  q: Joi.string().optional(),
})

router.get('/', validate(listQuery, 'query'), optionalAuth, PostController.list)

// GET /api/posts/:id - get one
const idParam = Joi.object({ id: Joi.number().integer().required() })
router.get('/:id', validate(idParam, 'params'), PostController.get)

// POST /api/posts - admin only
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const createBody = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).required(),
  preview: Joi.string().allow(null, ''),
  image_id: Joi.string().uuid().optional().allow(null),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  is_premium: Joi.boolean().default(false),
  labels: Joi.array().items(Joi.string()).default([]),
  author_id: Joi.number().integer().optional(),
})
router.post('/', upload.single('image'), validate(createBody), requireAuth, extractUser, requireRole(['admin']), PostController.create)

// PUT /api/posts/:id - admin only
const updateBody = createBody.fork(['title', 'content', 'author_id'], (s) => s.optional())
router.put('/:id', upload.single('image'), validate(idParam, 'params'), validate(updateBody), requireAuth, extractUser, requireRole(['admin']), PostController.update)

// DELETE /api/posts/:id - soft delete (admin only)
router.delete('/:id', validate(idParam, 'params'), requireAuth, extractUser, requireRole(['admin']), PostController.softDelete)

export default router


