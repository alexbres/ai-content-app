export interface User {
  id: number;
  auth0_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  preview?: string;
  status: 'draft' | 'published' | 'archived';
  is_premium: boolean;
  labels: string[];
  author_id: number;
  created_at: Date;
  updated_at: Date;
  like_count?: number;
  dislike_count?: number;
  comment_count?: number;
  user_interaction?: 'like' | 'dislike' | 'favorite' | null;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
  user?: Pick<User, 'name' | 'avatar_url'>;
}

export interface Subscription {
  id: number;
  user_id: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  plan?: 'monthly' | 'yearly' | 'trial';
  current_period_end?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

