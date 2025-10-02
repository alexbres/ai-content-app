import { Outlet } from 'react-router-dom'
import { useRole } from '../../hooks/useRole'

export function AdminRoute() {
  const { isAdmin } = useRole()
  if (!isAdmin) return null
  return <Outlet />
}


