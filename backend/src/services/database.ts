import 'dotenv/config';
import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.warn('DATABASE_URL is not set. Database features will be unavailable until configured.');
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export async function testConnection(retries = 5, backoffMs = 1000): Promise<void> {
  let attempt = 0;
  // Exponential backoff with jitter
  while (attempt <= retries) {
    try {
      await pool.query('SELECT 1');
      if (attempt > 0) {
        logger.info(`Database connection established after ${attempt} retry(ies).`);
      }
      return;
    } catch (error) {
      attempt += 1;
      const isLast = attempt > retries;
      const delay = Math.round(backoffMs * Math.pow(2, attempt - 1) * (0.75 + Math.random() * 0.5));
      logger.warn(`Database connection failed (attempt ${attempt}/${retries}).${isLast ? '' : ` Retrying in ${delay}ms...`}`, {
        error: (error as Error).message,
      });
      if (isLast) {
        logger.error('Exhausted retries for database connection.');
        throw error;
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

export async function shutdownPool(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database pool shut down.');
  } catch (error) {
    logger.error('Error shutting down database pool', { error: (error as Error).message });
  }
}


