import { AppBar, Box, Container, IconButton, Toolbar, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Link from '@mui/material/Link'
import { useThemeMode } from '../../styles/theme'

type Props = { children: ReactNode }

export function AppLayout({ children }: Props) {
  const { mode, toggleColorMode } = useThemeMode()

  return (
    <Box display="flex" minHeight="100dvh" flexDirection="column">
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AI Content App
          </Typography>
          <Box display="flex" gap={2} alignItems="center" mr={1}>
            <Link component={RouterLink} to="/" color="inherit" underline="hover">
              Home
            </Link>
            <Link component={RouterLink} to="/login" color="inherit" underline="hover">
              Login
            </Link>
            <Link component={RouterLink} to="/admin" color="inherit" underline="hover">
              Admin
            </Link>
          </Box>
          <IconButton color="inherit" onClick={toggleColorMode} aria-label="toggle theme">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ py: 3, flexGrow: 1 }}>{children}</Container>
    </Box>
  )
}


