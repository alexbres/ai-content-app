import { Box, Typography } from '@mui/material'
import PostsManagement from '../components/posts/PostsManagement'

export function AdminPostsPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Posts</Typography>
      <PostsManagement />
    </Box>
  )
}

export default AdminPostsPage




