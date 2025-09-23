import { Button, ButtonProps } from '@mui/material'
import { useAuth } from '../../hooks/useAuth'

export function LoginButton(props: ButtonProps) {
  const { loginWithRedirect, isLoading } = useAuth()
  return (
    <Button onClick={() => loginWithRedirect()} disabled={isLoading} {...props}>
      Login
    </Button>
  )
}


