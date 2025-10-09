import { Stack, IconButton, Tooltip, Typography } from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt'
import { formatCompactNumber } from '../../utils/number'

type Props = {
  liked: boolean
  disliked: boolean
  favored: boolean
  likeCount: number
  dislikeCount: number
  onLike: () => void
  onDislike: () => void
  onFavorite: () => void
  loading?: { like?: boolean; dislike?: boolean; favorite?: boolean }
}

export function InteractionButtons({ liked, disliked, favored, likeCount, dislikeCount, onLike, onDislike, onFavorite, loading }: Props) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Tooltip title="Like">
        <span>
          <IconButton onClick={onLike} disabled={loading?.like} color={liked ? 'primary' as any : 'default'}>
            {liked ? <ThumbUpAltIcon /> : <ThumbUpAltOutlinedIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <Typography variant="caption">{formatCompactNumber(likeCount)}</Typography>
      <Tooltip title="Dislike">
        <span>
          <IconButton onClick={onDislike} disabled={loading?.dislike} color={disliked ? 'primary' as any : 'default'}>
            {disliked ? <ThumbDownAltIcon /> : <ThumbDownAltOutlinedIcon />}
          </IconButton>
        </span>
      </Tooltip>
      <Typography variant="caption">{formatCompactNumber(dislikeCount)}</Typography>
      <Tooltip title={favored ? 'Unfavorite' : 'Favorite'}>
        <span>
          <IconButton onClick={onFavorite} disabled={loading?.favorite} color={favored ? 'primary' as any : 'default'}>
            {favored ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )
}

export default InteractionButtons


