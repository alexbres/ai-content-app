import { Router } from 'express'
import { requireAuth, extractUser, optionalAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import Joi from 'joi'
import { InteractionController } from '../controllers/interaction.controller.js'

const router = Router()

const idParam = Joi.object({ id: Joi.number().integer().required() })

router.post('/:id/like', validate(idParam, 'params'), requireAuth, extractUser, InteractionController.toggleLike)
router.post('/:id/dislike', validate(idParam, 'params'), requireAuth, extractUser, InteractionController.toggleDislike)
router.post('/:id/favorite', validate(idParam, 'params'), requireAuth, extractUser, InteractionController.toggleFavorite)
router.get('/:id/interactions', validate(idParam, 'params'), optionalAuth, InteractionController.getStats)

export default router


