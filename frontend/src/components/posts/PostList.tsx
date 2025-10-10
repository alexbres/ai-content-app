import { useEffect, useRef, useState } from 'react'
import { Skeleton, Box, Typography, Alert } from '@mui/material'
import { listPosts, getInteractions, toggleLike, toggleDislike, toggleFavorite } from '../../services/posts'
import type { PostModel } from '../../types/auth'
import PostCard from './PostCard'

type Props = {
  onOpenPost?: (id: number) => void
  filters?: { search?: string; labels?: string[]; favorites?: boolean; premium?: boolean }
  onPageInfo?: (info: { total: number; pages: number }) => void
}

export function PostList({ onOpenPost, filters, onPageInfo }: Props) {
  const [posts, setPosts] = useState<PostModel[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buttonLoading, setButtonLoading] = useState<Record<number, { like?: boolean; dislike?: boolean; favorite?: boolean }>>({})
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset when filters change
  useEffect(() => {
    setPosts([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [filters?.search, filters?.premium, filters?.favorites, (filters?.labels || []).join(',')])

  useEffect(() => {
    let alive = true
    const load = async () => {
      if (loading || !hasMore) return
      setLoading(true)
      try {
        const res = await listPosts({ page, limit: 12, search: filters?.search, labels: filters?.labels, favorites: filters?.favorites, premium: filters?.premium })
        const newPosts = res.posts
        setPosts((prev) => {
          const seen = new Set(prev.map((p) => p.id))
          const unique = newPosts.filter((p) => !seen.has(p.id))
          return [...prev, ...unique]
        })
        setHasMore(page < res.pagination.pages)
        onPageInfo?.({ total: res.pagination.total, pages: res.pagination.pages })
      } catch (e: any) {
        setError(e?.message || 'Failed to load posts')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [page, filters?.search, filters?.premium, filters?.favorites, (filters?.labels || []).join(',')])

  useEffect(() => {
    if (!sentinelRef.current) return
    const el = sentinelRef.current
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setPage((p) => p + 1)
      }
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const optimisticUpdate = (id: number, updater: (p: PostModel) => PostModel) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? updater(p) : p)))
  }

  const withButtonLoading = (id: number, key: 'like' | 'dislike' | 'favorite', fn: () => Promise<void>) => {
    setButtonLoading((m) => ({ ...m, [id]: { ...(m[id] || {}), [key]: true } }))
    return fn().finally(() => setButtonLoading((m) => ({ ...m, [id]: { ...(m[id] || {}), [key]: false } })))
  }

  const handleLike = (id: number) => withButtonLoading(id, 'like', async () => {
    const cur = posts.find((p) => p.id === id)
    if (!cur) return
    const liked = cur.user_interaction === 'like'
    optimisticUpdate(id, (p) => ({ ...p, user_interaction: liked ? null : 'like', like_count: (p.like_count || 0) + (liked ? -1 : 1), dislike_count: liked ? p.dislike_count : p.dislike_count }))
    const stats = await toggleLike(id)
    optimisticUpdate(id, (p) => ({ ...p, like_count: stats.likes, dislike_count: stats.dislikes, user_interaction: stats.userInteraction }))
  })

  const handleDislike = (id: number) => withButtonLoading(id, 'dislike', async () => {
    const cur = posts.find((p) => p.id === id)
    if (!cur) return
    const disliked = cur.user_interaction === 'dislike'
    optimisticUpdate(id, (p) => ({ ...p, user_interaction: disliked ? null : 'dislike', dislike_count: (p.dislike_count || 0) + (disliked ? -1 : 1) }))
    const stats = await toggleDislike(id)
    optimisticUpdate(id, (p) => ({ ...p, like_count: stats.likes, dislike_count: stats.dislikes, user_interaction: stats.userInteraction }))
  })

  const handleFavorite = (id: number) => withButtonLoading(id, 'favorite', async () => {
    const cur = posts.find((p) => p.id === id)
    if (!cur) return
    const favored = cur.user_interaction === 'favorite'
    optimisticUpdate(id, (p) => ({ ...p, user_interaction: favored ? null : 'favorite' }))
    const stats = await toggleFavorite(id)
    optimisticUpdate(id, (p) => ({ ...p, user_interaction: stats.userInteraction }))
  })

  if (error) return <Alert severity="error">{error}</Alert>
  if (!posts.length && loading) return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
        sm: 'repeat(auto-fill, minmax(280px, 1fr))',
        md: 'repeat(auto-fill, minmax(300px, 1fr))',
      },
      gap: 2,
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={200} />
      ))}
    </Box>
  )

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {!posts.length ? (
        <Typography variant="body2" color="text.secondary">No posts yet</Typography>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            sm: 'repeat(auto-fill, minmax(280px, 1fr))',
            md: 'repeat(auto-fill, minmax(300px, 1fr))',
          },
          gap: 2,
          alignItems: 'stretch',
          width: '100%',
          maxWidth: '100%',
        }}>
          {posts.map((p) => (
            <Box key={p.id}>
              <PostCard
                post={p}
                onClick={onOpenPost}
                onLike={handleLike}
                onDislike={handleDislike}
                onFavorite={handleFavorite}
                loading={buttonLoading[p.id]}
              />
            </Box>
          ))}
        </Box>
      )}
      {hasMore && <div ref={sentinelRef} />}
    </Box>
  )
}

export default PostList


