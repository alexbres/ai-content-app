import { pool } from '../services/database.js';
import { logger } from '../utils/logger.js';
import type { User } from '../types/index.js';

export class UserRepository {
  static async findByAuth0Id(auth0Id: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE auth0_id = $1 LIMIT 1';
    try {
      logger.debug('UserRepository.findByAuth0Id start', { auth0Id });
      const { rows } = await pool.query<User>(sql, [auth0Id]);
      const user = rows[0] ?? null;
      logger.info('UserRepository.findByAuth0Id success', { found: Boolean(user) });
      return user;
    } catch (error) {
      logger.error('UserRepository.findByAuth0Id failed', { error: (error as Error).message, auth0Id });
      throw error;
    }
  }

  static async create(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const sql = `
      INSERT INTO users (auth0_id, email, name, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const params = [data.auth0_id, data.email, data.name ?? null, data.avatar_url ?? null];
    try {
      logger.debug('UserRepository.create start', { auth0_id: data.auth0_id, email: data.email });
      const { rows } = await pool.query<User>(sql, params);
      const created = rows[0];
      logger.info('UserRepository.create success', { id: created.id });
      return created;
    } catch (error) {
      logger.error('UserRepository.create failed', { error: (error as Error).message, data });
      throw error;
    }
  }

  static async update(id: number, data: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${i++}`);
      values.push(value);
    }
    if (!fields.length) return this.findById(id);
    const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
    values.push(id);
    try {
      logger.debug('UserRepository.update start', { id, fields: Object.keys(data) });
      const { rows } = await pool.query<User>(sql, values);
      const updated = rows[0] ?? null;
      logger.info('UserRepository.update success', { updated: Boolean(updated), id });
      return updated;
    } catch (error) {
      logger.error('UserRepository.update failed', { error: (error as Error).message, id, data });
      throw error;
    }
  }

  static async findById(id: number): Promise<User | null> {
    try {
      logger.debug('UserRepository.findById start', { id });
      const { rows } = await pool.query<User>('SELECT * FROM users WHERE id = $1', [id]);
      const user = rows[0] ?? null;
      logger.info('UserRepository.findById success', { found: Boolean(user), id });
      return user;
    } catch (error) {
      logger.error('UserRepository.findById failed', { error: (error as Error).message, id });
      throw error;
    }
  }
}


