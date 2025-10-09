import { Router } from 'express'
import { requireAuth, extractUser, optionalAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import Joi from 'joi'
import { CommentController } from '../controllers/comment.controller.js'

const router = Router()

const idParam = Joi.object({ id: Joi.number().integer().required() })
const listQuery = Joi.object({ page: Joi.number().integer().min(1).default(1), limit: Joi.number().integer().min(1).max(100).default(20) })
const createBody = Joi.object({ content: Joi.string().min(1).max(1000).required() })

router.get('/posts/:id/comments', validate(idParam, 'params'), validate(listQuery, 'query'), optionalAuth, CommentController.list)
router.post('/posts/:id/comments', validate(idParam, 'params'), validate(createBody), requireAuth, extractUser, CommentController.create)
router.delete('/comments/:id', validate(idParam, 'params'), requireAuth, extractUser, CommentController.delete)

export default router


