import { Router } from 'express';
import { requireAuth, extractUser } from '../middleware/auth.js';
import posts from './posts.js'
import interactions from './interactions.js'
import comments from './comments.js'

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/profile', requireAuth, extractUser, (req, res) => {
  res.json({ user: (req as any).user });
});

router.use('/api/posts', posts)
router.use('/api/posts', interactions)
router.use('/api', comments)

export default router;


