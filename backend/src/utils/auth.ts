import type { Request } from 'express'
import { UserRepository } from '../models/user.repository.js'
import { logger } from './logger.js'

export async function resolveNumericUserIdFromReq(req: Request): Promise<number | null> {
  try {
    const userFromRequest = (req as any).user as { id?: string | number; email?: string } | undefined
    if (!userFromRequest?.id) {
      logger.debug('No user id in request', { user: userFromRequest });
      return null;
    }
    
    if (typeof userFromRequest.id === 'number') {
      logger.debug('User id is already numeric', { userId: userFromRequest.id });
      return userFromRequest.id;
    }
    
    const auth0Id = String(userFromRequest.id);
    logger.debug('Looking up user by auth0Id', { auth0Id });
    
    const existingUser = await UserRepository.findByAuth0Id(auth0Id);
    if (existingUser) {
      logger.debug('Found existing user', { userId: existingUser.id, auth0Id });
      return existingUser.id;
    }
    
    const email = typeof userFromRequest.email === 'string' ? userFromRequest.email : undefined;
    if (!email) {
      logger.warn('No email provided for user creation', { auth0Id });
      return null;
    }
    
    logger.debug('Creating new user', { auth0Id, email });
    const created = await UserRepository.create({ auth0_id: auth0Id, email });
    logger.info('Created new user', { userId: created.id, auth0Id, email });
    return created.id;
  } catch (error) {
    logger.error('Error in resolveNumericUserIdFromReq', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export function getUserRolesFromReq(req: Request): string[] {
  const roles: string[] = (((req as any).user?.roles as string[]) || [])
  return roles
}


