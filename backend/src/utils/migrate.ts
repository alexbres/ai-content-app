import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { pool } from '../services/database.js';
import { logger } from './logger.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../../..');
const migrationsDir = path.join(rootDir, 'database', 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await pool.query<{ filename: string }>('SELECT filename FROM migrations ORDER BY id ASC');
  return new Set(rows.map((r) => r.filename));
}

function readMigrationFiles(): string[] {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = readMigrationFiles();

  for (const file of files) {
    if (applied.has(file)) {
      logger.debug(`Skipping already applied migration: ${file}`);
      continue;
    }
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');
    logger.info(`Applying migration: ${file}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO migrations(filename) VALUES($1)', [file]);
      await client.query('COMMIT');
      logger.info(`Migration applied: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Migration failed: ${file}`, { error: (error as Error).message });
      throw error;
    } finally {
      client.release();
    }
  }
}

// Allow running as a script: ts-node src/utils/migrate.ts
if (process.argv[1] && process.argv[1].includes('migrate')) {
  runMigrations()
    .then(() => {
      logger.info('All migrations applied.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Migration process failed', { error: (err as Error).message });
      process.exit(1);
    });
}


