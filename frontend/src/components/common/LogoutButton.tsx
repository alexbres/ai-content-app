import { Button, ButtonProps } from '@mui/material'
import { useAuth } from '../../hooks/useAuth'

export function LogoutButton(props: ButtonProps) {
  const { logout, isLoading } = useAuth()
  return (
    <Button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} disabled={isLoading} {...props}>
      Logout
    </Button>
  )
}


