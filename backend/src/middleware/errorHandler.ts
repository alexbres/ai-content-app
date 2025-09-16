import type { Request, Response, NextFunction } from 'express';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [new winston.transports.Console()],
});

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const error = err as Error & { status?: number };
  const status = error.status ?? 500;
  logger.error(error.stack || error.message);
  res.status(status).json({ error: status === 500 ? 'Internal Server Error' : error.message });
}


