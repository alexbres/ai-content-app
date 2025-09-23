import { Avatar, Box, Typography } from '@mui/material'
import { useAuth } from '../../hooks/useAuth'

export function UserProfile() {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Typography>Loading...</Typography>
  if (!isAuthenticated || !user) return null
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Avatar src={user.picture} alt={user.name} sx={{ width: 28, height: 28 }} />
      <Typography>{user.name}</Typography>
    </Box>
  )
}


