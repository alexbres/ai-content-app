import { Box, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { PostList } from '../components/posts'

export function HomePage() {
  const navigate = useNavigate()
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Posts</Typography>
      <PostList onOpenPost={(id) => navigate(`/posts/${id}`)} />
    </Box>
  )
}


