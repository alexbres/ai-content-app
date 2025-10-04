import { Box, Typography, Button, Stack } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export function AdminPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin
      </Typography>
      <Typography color="text.secondary">Restricted area</Typography>
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="contained" component={RouterLink} to="/admin/posts/new">
          Create Post
        </Button>
        <Button variant="outlined" component={RouterLink} to="/admin/posts">
          Posts
        </Button>
      </Stack>
    </Box>
  )
}


