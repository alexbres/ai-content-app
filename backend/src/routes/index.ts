import { Router } from 'express';
import { requireAuth, extractUser } from '../middleware/auth.js';
import posts from './posts.js'
import { Router as ImagesRouter } from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { fileTypeFromFile } from 'file-type'
import interactions from './interactions.js'
import comments from './comments.js'

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve images stored at ../images via dynamic content type
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../../..')

const images = ImagesRouter()
images.get('/:id', async (req, res) => {
  try {
    const id = req.params.id
    // Prefer PNG-named file
    const pngPath = path.join(rootDir, 'images', `${id}.png`)
    let imgPath = pngPath
    try {
      const statPng = await fs.stat(pngPath)
      if (!statPng.isFile()) throw new Error('not a file')
    } catch {
      // Fallback to legacy filename without extension
      const legacyPath = path.join(rootDir, 'images', id)
      const statLegacy = await fs.stat(legacyPath)
      if (!statLegacy.isFile()) return res.status(404).json({ error: 'Not Found' })
      imgPath = legacyPath
    }
    const ft = await fileTypeFromFile(imgPath)
    if (ft?.mime) res.setHeader('Content-Type', ft.mime)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.sendFile(imgPath)
  } catch (e) {
    res.status(404).json({ error: 'Not Found' })
  }
})
// Mount under /api/images to match frontend baseURL, keep legacy /images for backwards compat
router.use('/api/images', images)
router.use('/images', images)

router.get('/profile', requireAuth, extractUser, (req, res) => {
  res.json({ user: (req as any).user });
});

router.use('/api/posts', posts)
router.use('/api/posts', interactions)
router.use('/api', comments)

export default router;


