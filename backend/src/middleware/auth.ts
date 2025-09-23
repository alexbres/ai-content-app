import { auth, requiredScopes } from 'express-oauth2-jwt-bearer'
import type { RequestHandler } from 'express'

const audience = process.env.AUTH0_AUDIENCE
const issuerBaseURL = process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}/` : undefined

export const requireAuth: RequestHandler = auth({
  audience,
  issuerBaseURL,
  tokenSigningAlg: 'RS256',
})

export function checkRole(role: string): RequestHandler {
  return (req, res, next) => {
    const rolesClaim = process.env.AUTH0_ROLES_CLAIM || 'https://your.app/roles'
    const roles: string[] = (req.auth?.payload[rolesClaim] as string[]) || []
    if (!roles.includes(role)) return res.status(403).json({ error: 'forbidden' })
    next()
  }
}

export const extractUser: RequestHandler = (req, _res, next) => {
  // expose basic user info for handlers
  const sub = req.auth?.payload.sub
  const email = (req.auth?.payload as any)?.email
  ;(req as any).user = { id: sub, email }
  next()
}

export const requireScopes = (scopes: string[]): RequestHandler => requiredScopes(scopes)


