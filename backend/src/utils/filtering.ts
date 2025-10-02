export type PostFilters = {
  status?: 'draft' | 'published' | 'archived';
  label?: string; // single label (back-compat)
  labels?: string[]; // multiple labels (OR)
  is_premium?: boolean;
  author_id?: number;
  q?: string; // title ILIKE
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
  if (filters.labels && filters.labels.length) {
    const ors: string[] = [];
    for (const lbl of filters.labels) {
      ors.push(`$${i++} = ANY(labels)`);
      params.push(lbl);
    }
    clauses.push(`(${ors.join(' OR ')})`);
  }

  if (typeof filters.is_premium === 'boolean') {
    clauses.push(`is_premium = $${i++}`);
    params.push(filters.is_premium);
  }

  if (filters.q) {
    clauses.push(`title ILIKE $${i++}`);
    params.push(`%${filters.q}%`);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { whereSql, params, nextIdx: i };
}


