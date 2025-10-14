import { useEffect, useMemo, useState } from 'react'
import { Box, Breadcrumbs, Link as MLink, Typography, Stack, IconButton, Alert } from '@mui/material'
import ShareIcon from '@mui/icons-material/Share'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPost, getInteractions, toggleLike, toggleDislike, toggleFavorite, listComments, createComment } from '../../services/posts'
import type { PostModel } from '../../types/auth'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import InteractionButtons from './InteractionButtons'

export function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const postId = Number(id)
  const [post, setPost] = useState<PostModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [statsLoading, setStatsLoading] = useState<{ like?: boolean; dislike?: boolean; favorite?: boolean }>({})
  const [comments, setComments] = useState<{ id: number; content: string; created_at: string; user: { name?: string; avatar_url?: string } }[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const p = await getPost(postId)
        if (!alive) return
        setPost(p)
        const stats = await getInteractions(postId)
        if (!alive) return
        setPost((prev) => (prev ? { ...prev, like_count: stats.likes, dislike_count: stats.dislikes, user_interaction: stats.userInteraction } : prev))
        const cs = await listComments(postId, { page: 1, limit: 50 })
        if (!alive) return
        setComments(cs)
      } catch (e: any) {
        setErr(e?.message || 'Failed to load')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [postId])

  const readingTime = useMemo(() => {
    const words = (post?.content || '').split(/\s+/).filter(Boolean).length
    const minutes = Math.max(1, Math.round(words / 200))
    return `${minutes} min read`
  }, [post?.content])

  const share = async () => {
    const url = window.location.href
    const title = post?.title || 'Post'
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title, url }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(url) } catch {}
      alert('Link copied')
    }
  }

  const withBtn = (key: 'like' | 'dislike' | 'favorite', fn: () => Promise<void>) => {
    setStatsLoading((s) => ({ ...s, [key]: true }))
    return fn().finally(() => setStatsLoading((s) => ({ ...s, [key]: false })))
  }

  const onLike = () => withBtn('like', async () => {
    const stats = await toggleLike(postId)
    setPost((p) => (p ? { ...p, like_count: stats.likes, dislike_count: stats.dislikes, user_interaction: stats.userInteraction } : p))
  })
  const onDislike = () => withBtn('dislike', async () => {
    const stats = await toggleDislike(postId)
    setPost((p) => (p ? { ...p, like_count: stats.likes, dislike_count: stats.dislikes, user_interaction: stats.userInteraction } : p))
  })
  const onFavorite = () => withBtn('favorite', async () => {
    const stats = await toggleFavorite(postId)
    setPost((p) => (p ? { ...p, user_interaction: stats.userInteraction } : p))
  })

  if (loading) return <Typography>Loading...</Typography>
  if (err || !post) return <Alert severity="error">{err || 'Not found'}</Alert>

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MLink component={Link} underline="hover" color="inherit" to="/">Home</MLink>
        <Typography color="text.primary">{post.title}</Typography>
      </Breadcrumbs>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h4">{post.title}</Typography>
        <IconButton onClick={share}><ShareIcon /></IconButton>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{readingTime}</Typography>
      {post.image_id && (
        <Box sx={{ mb: 2 }}>
          <img src={`/api/images/${post.image_id}`} alt={post.title} style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }} />
        </Box>
      )}
      <Box sx={{ '& img': { maxWidth: '100%' } }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize]]}>{post.content}</ReactMarkdown>
      </Box>
      <Box sx={{ mt: 2 }}>
        <InteractionButtons
          liked={post.user_interaction === 'like'}
          disliked={post.user_interaction === 'dislike'}
          favored={post.user_interaction === 'favorite'}
          likeCount={post.like_count || 0}
          dislikeCount={post.dislike_count || 0}
          onLike={onLike}
          onDislike={onDislike}
          onFavorite={onFavorite}
          loading={statsLoading}
        />
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Comments</Typography>
        {comments.map((c) => (
          <Box key={c.id} sx={{ py: 1, borderTop: (t) => `1px solid ${t.palette.divider}` }}>
            <Typography variant="subtitle2">{c.user.name || 'User'}</Typography>
            <Typography variant="body2">{c.content}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default PostDetail


