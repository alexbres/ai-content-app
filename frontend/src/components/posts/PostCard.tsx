import { Card, CardActionArea, CardContent, CardHeader, Chip, Stack, Typography, CardActions, IconButton, Tooltip, Box } from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt'
import LockIcon from '@mui/icons-material/Lock'
import { useMemo } from 'react'
import type { PostModel } from '../../types/auth'
import { formatCompactNumber } from '../../utils/number'

type Props = {
  post: PostModel
  onClick?: (id: number) => void
  onLike?: (id: number) => void
  onDislike?: (id: number) => void
  onFavorite?: (id: number) => void
  loading?: { like?: boolean; dislike?: boolean; favorite?: boolean }
}

export function PostCard({ post, onClick, onLike, onDislike, onFavorite, loading }: Props) {
  const preview = useMemo(() => (post.preview ? post.preview : (post.content || '').slice(0, 220)), [post.preview, post.content])
  const liked = post.user_interaction === 'like'
  const disliked = post.user_interaction === 'dislike'
  const favored = post.user_interaction === 'favorite'

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '100%', overflow: 'hidden' }}>
      <CardActionArea onClick={() => onClick?.(post.id)} sx={{ flexGrow: 1 }}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              {post.is_premium && (
                <Tooltip title="Premium">
                  <LockIcon fontSize="small" />
                </Tooltip>
              )}
              <Typography component="h3" variant="h6" sx={{ minWidth: 0, maxWidth: '100%', whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{post.title}</Typography>
            </Stack>
          }
          subheader={
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ maxWidth: '100%', overflow: 'hidden' }}>
              {post.labels?.map((l) => (
                <Chip key={l} size="small" label={l} variant="outlined" />
              ))}
            </Stack>
          }
        />
        <CardContent sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {preview}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => onLike?.(post.id)} disabled={loading?.like} color={liked ? 'primary' as any : 'default'}>
            {liked ? <ThumbUpAltIcon /> : <ThumbUpAltOutlinedIcon />}
          </IconButton>
          <Typography variant="caption">{formatCompactNumber(post.like_count ?? 0)}</Typography>
          <IconButton onClick={() => onDislike?.(post.id)} disabled={loading?.dislike} color={disliked ? 'primary' as any : 'default'}>
            {disliked ? <ThumbDownAltIcon /> : <ThumbDownAltOutlinedIcon />}
          </IconButton>
          <Typography variant="caption">{formatCompactNumber(post.dislike_count ?? 0)}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => onFavorite?.(post.id)} disabled={loading?.favorite} color={favored ? 'primary' as any : 'default'}>
            {favored ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <Typography variant="caption">{formatCompactNumber(post.comment_count ?? 0)} comments</Typography>
        </Stack>
      </CardActions>
    </Card>
  )
}

export default PostCard


