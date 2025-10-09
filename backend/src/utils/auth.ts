import type { Request } from 'express'
import { UserRepository } from '../models/user.repository.js'

export async function resolveNumericUserIdFromReq(req: Request): Promise<number | null> {
  const userFromRequest = (req as any).user as { id?: string | number; email?: string } | undefined
  if (!userFromRequest?.id) return null
  if (typeof userFromRequest.id === 'number') return userFromRequest.id
  const auth0Id = String(userFromRequest.id)
  const existingUser = await UserRepository.findByAuth0Id(auth0Id)
  if (existingUser) return existingUser.id
  const email = typeof userFromRequest.email === 'string' ? userFromRequest.email : undefined
  if (!email) return null
  const created = await UserRepository.create({ auth0_id: auth0Id, email })
  return created.id
}

export function getUserRolesFromReq(req: Request): string[] {
  const roles: string[] = (((req as any).user?.roles as string[]) || [])
  return roles
}


