import { pool } from '../services/database.js';
import { logger } from '../utils/logger.js';
import type { Comment, PaginationQuery } from '../types/index.js';
import { normalizePagination } from '../utils/pagination.js';

export class CommentRepository {
  static async findByPostId(postId: number, pagination: PaginationQuery = {}): Promise<Comment[]> {
    const { limit, offset } = normalizePagination(pagination);
    const sql = `
      SELECT c.*, u.name, u.avatar_url
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    try {
      logger.debug('CommentRepository.findByPostId start', { postId, limit, offset });
      const { rows } = await pool.query<(Comment & { name: string | null; avatar_url: string | null })>(sql, [postId, limit, offset]);
      const mapped = rows.map((r) => ({
        id: r.id,
        post_id: r.post_id,
        user_id: r.user_id,
        content: r.content,
        created_at: r.created_at,
        updated_at: r.updated_at,
        user: { name: r.name ?? undefined, avatar_url: r.avatar_url ?? undefined },
      }));
      logger.info('CommentRepository.findByPostId success', { returned: mapped.length });
      return mapped;
    } catch (error) {
      logger.error('CommentRepository.findByPostId failed', { error: (error as Error).message, postId, pagination });
      throw error;
    }
  }

  static async create(data: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'user'>): Promise<Comment> {
    const sql = `
      INSERT INTO comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const params = [data.post_id, data.user_id, data.content];
    try {
      logger.debug('CommentRepository.create start', { post_id: data.post_id, user_id: data.user_id });
      const { rows } = await pool.query<Comment>(sql, params);
      const created = rows[0];
      logger.info('CommentRepository.create success', { id: created.id });
      return created;
    } catch (error) {
      logger.error('CommentRepository.create failed', { error: (error as Error).message, data });
      throw error;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      logger.debug('CommentRepository.delete start', { id });
      const { rowCount } = await pool.query('DELETE FROM comments WHERE id = $1', [id]);
      const ok = (rowCount ?? 0) > 0;
      logger.info('CommentRepository.delete success', { deleted: ok, id });
      return ok;
    } catch (error) {
      logger.error('CommentRepository.delete failed', { error: (error as Error).message, id });
      throw error;
    }
  }
}


