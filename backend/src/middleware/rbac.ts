import type { NextFunction, Request, Response } from 'express'

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles: string[] = ((req as any).user?.roles as string[]) || []
    const hasRequiredRole = roles.some((role) => userRoles.includes(role))
    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}


