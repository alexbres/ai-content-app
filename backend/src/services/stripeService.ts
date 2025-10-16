import Stripe from 'stripe';
import { logger } from '../utils/logger.js';
import { SubscriptionRepository } from '../models/subscription.repository.js';
import { UserRepository } from '../models/user.repository.js';

export class StripeService {
  public stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });
  }

  async createCheckoutSession(userId: number, priceId: string, successUrl: string, cancelUrl: string) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user already has a Stripe customer
      let customerId = await this.getOrCreateCustomer(user);

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId.toString(),
        },
        subscription_data: {
          metadata: {
            userId: userId.toString(),
          },
        },
      });

      logger.info(`Created checkout session for user ${userId}`, { sessionId: session.id });
      return session;
    } catch (error) {
      logger.error('Error creating checkout session', { error, userId, priceId });
      throw error;
    }
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info(`Created customer portal session for customer ${customerId}`);
      return session;
    } catch (error) {
      logger.error('Error creating customer portal session', { error, customerId });
      throw error;
    }
  }

  async handleWebhook(event: Stripe.Event) {
    try {
      logger.info(`Processing webhook event: ${event.type}`, { eventId: event.id });

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling webhook', { error, eventType: event.type, eventId: event.id });
      throw error;
    }
  }

  private async getOrCreateCustomer(user: any): Promise<string> {
    try {
      // First check if user already has a subscription with customer_id
      const existingSubscription = await SubscriptionRepository.findByUserId(user.id);
      if (existingSubscription?.stripe_customer_id) {
        return existingSubscription.stripe_customer_id;
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id.toString(),
        },
      });

      logger.info(`Created Stripe customer for user ${user.id}`, { customerId: customer.id });
      return customer.id;
    } catch (error) {
      logger.error('Error creating/getting customer', { error, userId: user.id });
      throw error;
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const userId = parseInt(subscription.metadata.userId);
    if (!userId) {
      logger.error('No userId in subscription metadata', { subscriptionId: subscription.id });
      return;
    }

    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: this.mapStripeStatus(subscription.status),
      plan: this.determinePlan(subscription),
      current_period_end: new Date((subscription as any).current_period_end * 1000),
    };

    await SubscriptionRepository.createOrUpdate(subscriptionData);
    logger.info(`Created subscription for user ${userId}`, { subscriptionId: subscription.id });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = parseInt(subscription.metadata.userId);
    if (!userId) {
      logger.error('No userId in subscription metadata', { subscriptionId: subscription.id });
      return;
    }

    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      status: this.mapStripeStatus(subscription.status),
      plan: this.determinePlan(subscription),
      current_period_end: new Date((subscription as any).current_period_end * 1000),
    };

    await SubscriptionRepository.createOrUpdate(subscriptionData);
    logger.info(`Updated subscription for user ${userId}`, { subscriptionId: subscription.id });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = parseInt(subscription.metadata.userId);
    if (!userId) {
      logger.error('No userId in subscription metadata', { subscriptionId: subscription.id });
      return;
    }

    await SubscriptionRepository.updateStatus(userId, 'canceled');
    logger.info(`Canceled subscription for user ${userId}`, { subscriptionId: subscription.id });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription;
    if (subscriptionId) {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId as string);
      const userId = parseInt(subscription.metadata.userId);
      
      if (userId) {
        await SubscriptionRepository.updateStatus(userId, 'active');
        logger.info(`Payment succeeded for user ${userId}`, { invoiceId: invoice.id });
      }
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription;
    if (subscriptionId) {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId as string);
      const userId = parseInt(subscription.metadata.userId);
      
      if (userId) {
        await SubscriptionRepository.updateStatus(userId, 'past_due');
        logger.info(`Payment failed for user ${userId}`, { invoiceId: invoice.id });
      }
    }
  }

  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): 'active' | 'inactive' | 'canceled' | 'past_due' {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'canceled':
        return 'canceled';
      case 'past_due':
        return 'past_due';
      case 'unpaid':
      case 'incomplete':
      case 'incomplete_expired':
      case 'trialing':
      default:
        return 'inactive';
    }
  }

  private determinePlan(subscription: Stripe.Subscription): 'monthly' | 'yearly' | 'trial' {
    if (subscription.status === 'trialing') {
      return 'trial';
    }

    const interval = subscription.items.data[0]?.price?.recurring?.interval;
    return interval === 'year' ? 'yearly' : 'monthly';
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      logger.error('Error retrieving subscription', { error, subscriptionId });
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      logger.error('Error canceling subscription', { error, subscriptionId });
      return null;
    }
  }
}
