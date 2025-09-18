import { pool } from '../services/database.js';
import { logger } from '../utils/logger.js';
import type { Post, PaginationQuery, PaginatedResult } from '../types/index.js';
import { normalizePagination, toPaginatedResult } from '../utils/pagination.js';
import { buildPostWhere, type PostFilters } from '../utils/filtering.js';

export class PostRepository {
  static async findAll(pagination: PaginationQuery = {}): Promise<PaginatedResult<Post>> {
    const { limit, offset } = normalizePagination(pagination);
    try {
      logger.debug('PostRepository.findAll start', { limit, offset });
      const [{ rows }, totalRes] = await Promise.all([
        pool.query<Post>('SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
        pool.query<{ count: string }>('SELECT COUNT(*)::text as count FROM posts'),
      ]);
      const total = Number(totalRes.rows[0]?.count ?? 0);
      logger.info('PostRepository.findAll success', { returned: rows.length, total });
      return toPaginatedResult(rows, total, { limit, offset });
    } catch (error) {
      logger.error('PostRepository.findAll failed', { error: (error as Error).message, pagination });
      throw error;
    }
  }

  static async findById(id: number): Promise<Post | null> {
    try {
      logger.debug('PostRepository.findById start', { id });
      const { rows } = await pool.query<Post>('SELECT * FROM posts WHERE id = $1', [id]);
      const post = rows[0] ?? null;
      logger.info('PostRepository.findById success', { found: Boolean(post) });
      return post;
    } catch (error) {
      logger.error('PostRepository.findById failed', { error: (error as Error).message, id });
      throw error;
    }
  }

  static async create(data: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'like_count' | 'dislike_count' | 'comment_count' | 'user_interaction'>): Promise<Post> {
    const sql = `
      INSERT INTO posts (title, content, preview, status, is_premium, labels, author_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      data.title,
      data.content,
      data.preview ?? null,
      data.status ?? 'draft',
      data.is_premium ?? false,
      data.labels ?? [],
      data.author_id,
    ];
    try {
      logger.debug('PostRepository.create start', { title: data.title, author_id: data.author_id });
      const { rows } = await pool.query<Post>(sql, params);
      const created = rows[0];
      logger.info('PostRepository.create success', { id: created.id });
      return created;
    } catch (error) {
      logger.error('PostRepository.create failed', { error: (error as Error).message, data });
      throw error;
    }
  }

  static async update(id: number, data: Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>>): Promise<Post | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${i++}`);
      values.push(value);
    }
    if (!fields.length) return this.findById(id);
    const sql = `UPDATE posts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
    values.push(id);
    try {
      logger.debug('PostRepository.update start', { id, fields: Object.keys(data) });
      const { rows } = await pool.query<Post>(sql, values);
      const updated = rows[0] ?? null;
      logger.info('PostRepository.update success', { updated: Boolean(updated), id });
      return updated;
    } catch (error) {
      logger.error('PostRepository.update failed', { error: (error as Error).message, id, data });
      throw error;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      logger.debug('PostRepository.delete start', { id });
      const { rowCount } = await pool.query('DELETE FROM posts WHERE id = $1', [id]);
      const ok = (rowCount ?? 0) > 0;
      logger.info('PostRepository.delete success', { deleted: ok, id });
      return ok;
    } catch (error) {
      logger.error('PostRepository.delete failed', { error: (error as Error).message, id });
      throw error;
    }
  }

  static async findWithFilters(
    filters: PostFilters,
    pagination: PaginationQuery = {}
  ): Promise<PaginatedResult<Post>> {
    const { limit, offset } = normalizePagination(pagination);
    const { whereSql, params, nextIdx } = buildPostWhere(filters, 1);
    const listSql = `SELECT * FROM posts ${whereSql} ORDER BY created_at DESC LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`;
    const countSql = `SELECT COUNT(*)::text as count FROM posts ${whereSql}`;
    const listParams = [...params, limit, offset];
    try {
      logger.debug('PostRepository.findWithFilters start', { filters, limit, offset });
      const [{ rows }, totalRes] = await Promise.all([
        pool.query<Post>(listSql, listParams),
        pool.query<{ count: string }>(countSql, params),
      ]);
      const total = Number(totalRes.rows[0]?.count ?? 0);
      logger.info('PostRepository.findWithFilters success', { returned: rows.length, total });
      return toPaginatedResult(rows, total, { limit, offset });
    } catch (error) {
      logger.error('PostRepository.findWithFilters failed', { error: (error as Error).message, filters, pagination });
      throw error;
    }
  }
}


