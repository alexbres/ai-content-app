import { Button, ButtonProps } from '@mui/material'
import { useAuth } from '../../hooks/useAuth'

export function LoginButton(props: ButtonProps) {
  const { loginWithPopup, isLoading } = useAuth()
  
  const handleLogin = () => {
    if (loginWithPopup) {
      loginWithPopup()
    }
  }
  
  return (
    <Button onClick={handleLogin} disabled={isLoading} {...props}>
      Login
    </Button>
  )
}


