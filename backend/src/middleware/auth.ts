import { auth, requiredScopes } from 'express-oauth2-jwt-bearer'
import type { RequestHandler } from 'express'
import { logger } from '../utils/logger.js'

const audience = process.env.AUTH0_AUDIENCE
const issuerBaseURL = process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}/` : undefined

// Log Auth0 configuration at startup
if (!audience || !issuerBaseURL) {
  logger.warn('Auth0 configuration incomplete', {
    hasAudience: !!audience,
    hasDomain: !!process.env.AUTH0_DOMAIN,
    audience,
    domain: process.env.AUTH0_DOMAIN
  });
} else {
  logger.info('Auth0 configuration loaded', {
    audience,
    issuerBaseURL
  });
}

export const requireAuth: RequestHandler = auth({
  audience,
  issuerBaseURL,
  tokenSigningAlg: 'RS256',
})

export function checkRole(role: string): RequestHandler {
  return (req, res, next) => {
    const rolesClaim = process.env.AUTH0_ROLES_CLAIM || 'https://example.com/roles'
    const roles: string[] = (req.auth?.payload[rolesClaim] as string[]) || []
    if (!roles.includes(role)) return res.status(403).json({ error: 'forbidden' })
    next()
  }
}

export const extractUser: RequestHandler = (req, _res, next) => {
  // expose basic user info for handlers
  const sub = req.auth?.payload.sub
  const emailClaim = process.env.AUTH0_EMAIL_CLAIM || 'https://example.com/email'
  const email = (req.auth?.payload as any)?.[emailClaim]
  const rolesClaim = process.env.AUTH0_ROLES_CLAIM || 'https://example.com/roles'
  const roles: string[] = (req.auth?.payload[rolesClaim] as string[]) || []
  ;(req as any).user = { id: sub, email, roles }
  next()
}

export const requireScopes = (scopes: string[]): RequestHandler => requiredScopes(scopes)

// Optional auth: tries to authenticate and extract user, but does not fail the request
export const optionalAuth: RequestHandler = (req, res, next) => {
  if (!audience || !issuerBaseURL) return next()
  const mw = auth({ audience, issuerBaseURL, tokenSigningAlg: 'RS256' })
  mw(req, res, (err?: unknown) => {
    if (err) return next()
    return extractUser(req, res, next)
  })
}


