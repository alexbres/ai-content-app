import { Router } from 'express';
import { requireAuth, extractUser } from '../middleware/auth';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/profile', requireAuth, extractUser, (req, res) => {
  res.json({ user: (req as any).user });
});

export default router;


