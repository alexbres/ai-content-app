import { Router } from 'express';
import { requireAuth, extractUser } from '../middleware/auth.js';
import posts from './posts.js'

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/profile', requireAuth, extractUser, (req, res) => {
  res.json({ user: (req as any).user });
});

router.use('/api/posts', posts)

export default router;


