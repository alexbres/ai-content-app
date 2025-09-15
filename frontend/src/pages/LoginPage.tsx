import { Box, Button, TextField, Typography } from '@mui/material'

export function LoginPage() {
  return (
    <Box maxWidth={400} mx="auto">
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <TextField label="Email" type="email" fullWidth />
        <TextField label="Password" type="password" fullWidth />
        <Button>Login</Button>
      </Box>
    </Box>
  )
}


