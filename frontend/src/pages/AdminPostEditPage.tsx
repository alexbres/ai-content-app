import { Box, Typography } from '@mui/material'
import PostEditor from '../components/posts/PostEditor'
import { useParams } from 'react-router-dom'

export function AdminPostEditPage() {
  const params = useParams()
  const id = params.id ? Number(params.id) : undefined
  return (
    <Box>
      <Typography variant="h4" gutterBottom>{id ? 'Edit Post' : 'New Post'}</Typography>
      <PostEditor postId={id} />
    </Box>
  )
}

export default AdminPostEditPage





