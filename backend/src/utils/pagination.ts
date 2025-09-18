import type { PaginationQuery, PaginatedResult } from '../types/index.js';

export function normalizePagination(query: PaginationQuery): { limit: number; offset: number } {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);
  return { limit, offset };
}

export function toPaginatedResult<T>(rows: T[], total: number, pagination: { limit: number; offset: number }): PaginatedResult<T> {
  return {
    data: rows,
    total,
    limit: pagination.limit,
    offset: pagination.offset,
  };
}


