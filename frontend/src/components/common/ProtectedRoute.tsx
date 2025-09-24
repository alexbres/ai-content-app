import { Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) {
    void loginWithRedirect()
    return null
  }
  return <Outlet />
}


