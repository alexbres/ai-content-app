import { pool } from '../services/database.js';
import { logger } from '../utils/logger.js';
import type { Subscription } from '../types/index.js';

export class SubscriptionRepository {
  static async findByUserId(userId: number): Promise<Subscription | null> {
    try {
      logger.debug('SubscriptionRepository.findByUserId start', { userId });
      const { rows } = await pool.query<Subscription>('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
      const sub = rows[0] ?? null;
      logger.info('SubscriptionRepository.findByUserId success', { found: Boolean(sub), userId });
      return sub;
    } catch (error) {
      logger.error('SubscriptionRepository.findByUserId failed', { error: (error as Error).message, userId });
      throw error;
    }
  }

  static async create(data: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
    const sql = `
      INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      data.user_id,
      data.stripe_customer_id ?? null,
      data.stripe_subscription_id ?? null,
      data.status ?? 'inactive',
      data.plan ?? null,
      data.current_period_end ?? null,
    ];
    try {
      logger.debug('SubscriptionRepository.create start', { user_id: data.user_id, status: data.status });
      const { rows } = await pool.query<Subscription>(sql, params);
      const created = rows[0];
      logger.info('SubscriptionRepository.create success', { id: created.id });
      return created;
    } catch (error) {
      logger.error('SubscriptionRepository.create failed', { error: (error as Error).message, data });
      throw error;
    }
  }

  static async update(id: number, data: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>): Promise<Subscription | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${i++}`);
      values.push(value);
    }
    if (!fields.length) {
      const { rows } = await pool.query<Subscription>('SELECT * FROM subscriptions WHERE id = $1', [id]);
      return rows[0] ?? null;
    }
    const sql = `UPDATE subscriptions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`;
    values.push(id);
    try {
      logger.debug('SubscriptionRepository.update start', { id, fields: Object.keys(data) });
      const { rows } = await pool.query<Subscription>(sql, values);
      const updated = rows[0] ?? null;
      logger.info('SubscriptionRepository.update success', { updated: Boolean(updated), id });
      return updated;
    } catch (error) {
      logger.error('SubscriptionRepository.update failed', { error: (error as Error).message, id, data });
      throw error;
    }
  }

  static async createOrUpdate(data: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
    try {
      logger.debug('SubscriptionRepository.createOrUpdate start', { user_id: data.user_id });
      
      // Try to find existing subscription
      const existing = await this.findByUserId(data.user_id);
      
      if (existing) {
        // Update existing subscription
        const updated = await this.update(existing.id, data);
        if (!updated) {
          throw new Error('Failed to update subscription');
        }
        logger.info('SubscriptionRepository.createOrUpdate success - updated', { id: updated.id });
        return updated;
      } else {
        // Create new subscription
        const created = await this.create(data);
        logger.info('SubscriptionRepository.createOrUpdate success - created', { id: created.id });
        return created;
      }
    } catch (error) {
      logger.error('SubscriptionRepository.createOrUpdate failed', { error: (error as Error).message, data });
      throw error;
    }
  }

  static async updateStatus(userId: number, status: Subscription['status']): Promise<Subscription | null> {
    try {
      logger.debug('SubscriptionRepository.updateStatus start', { userId, status });
      
      const sql = `
        UPDATE subscriptions 
        SET status = $1, updated_at = NOW() 
        WHERE user_id = $2 
        RETURNING *
      `;
      
      const { rows } = await pool.query<Subscription>(sql, [status, userId]);
      const updated = rows[0] ?? null;
      
      logger.info('SubscriptionRepository.updateStatus success', { updated: Boolean(updated), userId, status });
      return updated;
    } catch (error) {
      logger.error('SubscriptionRepository.updateStatus failed', { error: (error as Error).message, userId, status });
      throw error;
    }
  }

  static async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    try {
      logger.debug('SubscriptionRepository.findByStripeSubscriptionId start', { stripeSubscriptionId });
      const { rows } = await pool.query<Subscription>(
        'SELECT * FROM subscriptions WHERE stripe_subscription_id = $1', 
        [stripeSubscriptionId]
      );
      const sub = rows[0] ?? null;
      logger.info('SubscriptionRepository.findByStripeSubscriptionId success', { found: Boolean(sub), stripeSubscriptionId });
      return sub;
    } catch (error) {
      logger.error('SubscriptionRepository.findByStripeSubscriptionId failed', { error: (error as Error).message, stripeSubscriptionId });
      throw error;
    }
  }
}


