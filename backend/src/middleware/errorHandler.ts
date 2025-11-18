import type { Request, Response, NextFunction } from 'express';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [new winston.transports.Console()],
});

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const error = err as Error & { status?: number; code?: string };
  const status = error.status ?? 500;
  const errorName = error.constructor?.name || typeof error;
  
  // Log detailed error information
  logger.error('Error handler triggered', {
    message: error.message,
    stack: error.stack,
    status,
    code: error.code,
    path: req.path,
    method: req.method,
    errorType: errorName
  });
  
  // Handle specific error types from express-oauth2-jwt-bearer
  let errorMessage: string;
  
  if (errorName === 'InvalidRequestError' || errorName === 'UnauthorizedError' || errorName === 'InvalidTokenError') {
    // Auth errors - provide clear message with details
    const authErrorDetails = error.message || '';
    if (status === 401 || status === 400) {
      if (authErrorDetails.includes('Compact JWS') || authErrorDetails.includes('JWS') || authErrorDetails.includes('JWT')) {
        errorMessage = `Invalid token format. Expected JWT (JWS) access token, but received JWE or invalid format. Make sure you're requesting an access token with audience: ${process.env.AUTH0_AUDIENCE || 'not configured'}`;
      } else if (authErrorDetails.includes('token') || authErrorDetails.includes('Token')) {
        errorMessage = `Authentication failed: ${authErrorDetails || 'Invalid or missing token'}`;
      } else if (authErrorDetails.includes('audience') || authErrorDetails.includes('Audience')) {
        errorMessage = `Authentication failed: Token audience mismatch. Expected: ${process.env.AUTH0_AUDIENCE || 'not configured'}`;
      } else if (authErrorDetails.includes('issuer') || authErrorDetails.includes('Issuer')) {
        errorMessage = `Authentication failed: Token issuer mismatch. Expected: ${process.env.AUTH0_DOMAIN || 'not configured'}`;
      } else {
        errorMessage = `Authentication required. ${authErrorDetails || 'Please provide a valid JWT token.'}`;
      }
    } else {
      errorMessage = error.message || 'Authentication failed';
    }
  } else if (status === 500) {
    errorMessage = 'Internal Server Error';
  } else if (error.message) {
    errorMessage = error.message;
  } else if (error.code) {
    errorMessage = `Error: ${error.code}`;
  } else {
    errorMessage = 'An error occurred';
  }
  
  res.status(status).json({ error: errorMessage });
}


