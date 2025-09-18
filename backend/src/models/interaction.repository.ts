import { pool } from '../services/database.js';
import { logger } from '../utils/logger.js';

export type InteractionType = 'like' | 'dislike' | 'favorite';

export class InteractionRepository {
  static async upsert(userId: number, postId: number, type: InteractionType): Promise<void> {
    const sql = `
      INSERT INTO interactions (user_id, post_id, type)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, post_id, type) DO UPDATE SET type = EXCLUDED.type
    `;
    try {
      console.debug && console.debug();
      // Structured log
      // Note: keeping params light to avoid logging PII beyond ids
      
      logger.debug('InteractionRepository.upsert start', { userId, postId, type });
      await pool.query(sql, [userId, postId, type]);
      logger.info('InteractionRepository.upsert success', { userId, postId, type });
    } catch (error) {
      logger.error('InteractionRepository.upsert failed', { error: (error as Error).message, userId, postId, type });
      throw error;
    }
  }

  static async delete(userId: number, postId: number, type: InteractionType): Promise<boolean> {
    try {
      logger.debug('InteractionRepository.delete start', { userId, postId, type });
      const { rowCount } = await pool.query('DELETE FROM interactions WHERE user_id = $1 AND post_id = $2 AND type = $3', [userId, postId, type]);
      const ok = (rowCount ?? 0) > 0;
      logger.info('InteractionRepository.delete success', { userId, postId, type, deleted: ok });
      return ok;
    } catch (error) {
      logger.error('InteractionRepository.delete failed', { error: (error as Error).message, userId, postId, type });
      throw error;
    }
  }

  static async getStats(postId: number): Promise<{ like_count: number; dislike_count: number; favorite_count: number }> {
    const sql = `
      SELECT
        SUM(CASE WHEN type = 'like' THEN 1 ELSE 0 END) AS like_count,
        SUM(CASE WHEN type = 'dislike' THEN 1 ELSE 0 END) AS dislike_count,
        SUM(CASE WHEN type = 'favorite' THEN 1 ELSE 0 END) AS favorite_count
      FROM interactions
      WHERE post_id = $1
    `;
    try {
      logger.debug('InteractionRepository.getStats start', { postId });
      const { rows } = await pool.query<{ like_count: string | null; dislike_count: string | null; favorite_count: string | null }>(sql, [postId]);
      const row = rows[0] ?? { like_count: '0', dislike_count: '0', favorite_count: '0' };
      return {
        like_count: Number(row.like_count ?? 0),
        dislike_count: Number(row.dislike_count ?? 0),
        favorite_count: Number(row.favorite_count ?? 0),
      };
    } catch (error) {
      logger.error('InteractionRepository.getStats failed', { error: (error as Error).message, postId });
      throw error;
    }
  }
}


