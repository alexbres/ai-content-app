import { useAuth } from './useAuth'

const DEFAULT_ROLES_CLAIM = 'https://example.com/roles'

export function useRole(claim: string = DEFAULT_ROLES_CLAIM) {
  const { user } = useAuth()
  const roles: string[] = (user?.[claim] as string[]) || []
  //roles[0] = 'user'
  console.debug('roles', roles)
  const hasRole = (role: string) => roles.includes(role)
  return { hasRole, isAdmin: hasRole('admin'), isUser: hasRole('user'), roles }
}


