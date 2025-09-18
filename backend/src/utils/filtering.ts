export type PostFilters = {
  status?: 'draft' | 'published' | 'archived';
  label?: string;
  author_id?: number;
  q?: string;
};

export function buildPostWhere(filters: PostFilters = {}, idxStart = 1): {
  whereSql: string;
  params: unknown[];
  nextIdx: number;
} {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let i = idxStart;

  if (filters.status) {
    clauses.push(`status = $${i++}`);
    params.push(filters.status);
  }

  if (typeof filters.author_id === 'number') {
    clauses.push(`author_id = $${i++}`);
    params.push(filters.author_id);
  }

  if (filters.label) {
    clauses.push(`$${i++} = ANY(labels)`);
    params.push(filters.label);
  }

  if (filters.q) {
    clauses.push(`(title ILIKE $${i} OR content ILIKE $${i})`);
    params.push(`%${filters.q}%`);
    i += 1;
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { whereSql, params, nextIdx: i };
}


