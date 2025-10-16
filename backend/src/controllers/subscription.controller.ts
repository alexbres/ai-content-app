import { Request, Response } from 'express';
import { StripeService } from '../services/stripeService.js';
import { SubscriptionRepository } from '../models/subscription.repository.js';
import { logger } from '../utils/logger.js';
import Joi from 'joi';

// Инициализируем StripeService только если есть ключ
let stripeService: StripeService | null = null;
try {
  stripeService = new StripeService();
} catch (error) {
  logger.warn('Stripe service not initialized - STRIPE_SECRET_KEY not found');
}

const checkoutSchema = Joi.object({
  priceId: Joi.string().required(),
  successUrl: Joi.string().uri().required(),
  cancelUrl: Joi.string().uri().required(),
});

const portalSchema = Joi.object({
  returnUrl: Joi.string().uri().required(),
});

export class SubscriptionController {
  static async createCheckoutSession(req: Request, res: Response) {
    try {
      if (!stripeService) {
        return res.status(503).json({ error: 'Stripe service not configured' });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { error, value } = checkoutSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { priceId, successUrl, cancelUrl } = value;

      // Check if user already has an active subscription
      const existingSubscription = await SubscriptionRepository.findByUserId(userId);
      if (existingSubscription && existingSubscription.status === 'active') {
        return res.status(400).json({ 
          error: 'User already has an active subscription',
          subscription: existingSubscription 
        });
      }

      const session = await stripeService.createCheckoutSession(
        userId,
        priceId,
        successUrl,
        cancelUrl
      );

      logger.info(`Created checkout session for user ${userId}`, { sessionId: session.id });
      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      logger.error('Error creating checkout session', { error, userId: req.user?.id });
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }

  static async createCustomerPortalSession(req: Request, res: Response) {
    try {
      if (!stripeService) {
        return res.status(503).json({ error: 'Stripe service not configured' });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { error, value } = portalSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { returnUrl } = value;

      // Get user's subscription to find customer ID
      const subscription = await SubscriptionRepository.findByUserId(userId);
      if (!subscription || !subscription.stripe_customer_id) {
        return res.status(404).json({ error: 'No subscription found for user' });
      }

      const session = await stripeService.createCustomerPortalSession(
        subscription.stripe_customer_id,
        returnUrl
      );

      logger.info(`Created customer portal session for user ${userId}`, { sessionId: session.id });
      res.json({ url: session.url });
    } catch (error) {
      logger.error('Error creating customer portal session', { error, userId: req.user?.id });
      res.status(500).json({ error: 'Failed to create customer portal session' });
    }
  }

  static async getSubscriptionStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const subscription = await SubscriptionRepository.findByUserId(userId);
      
      if (!subscription) {
        return res.json({ 
          hasSubscription: false,
          status: 'none',
          plan: null,
          currentPeriodEnd: null,
          isActive: false
        });
      }

      const isActive = subscription.status === 'active';
      const isTrial = subscription.plan === 'trial';
      const isPremium = isActive || isTrial;

      res.json({
        hasSubscription: true,
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodEnd: subscription.current_period_end,
        isActive,
        isTrial,
        isPremium,
        stripeCustomerId: subscription.stripe_customer_id,
        stripeSubscriptionId: subscription.stripe_subscription_id
      });
    } catch (error) {
      logger.error('Error getting subscription status', { error, userId: req.user?.id });
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  }

  static async cancelSubscription(req: Request, res: Response) {
    try {
      if (!stripeService) {
        return res.status(503).json({ error: 'Stripe service not configured' });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const subscription = await SubscriptionRepository.findByUserId(userId);
      if (!subscription || !subscription.stripe_subscription_id) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      const canceledSubscription = await stripeService.cancelSubscription(subscription.stripe_subscription_id);
      
      if (canceledSubscription) {
        await SubscriptionRepository.updateStatus(userId, 'canceled');
        logger.info(`Canceled subscription for user ${userId}`, { subscriptionId: subscription.stripe_subscription_id });
        res.json({ message: 'Subscription canceled successfully' });
      } else {
        res.status(500).json({ error: 'Failed to cancel subscription' });
      }
    } catch (error) {
      logger.error('Error canceling subscription', { error, userId: req.user?.id });
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }

  static async handleWebhook(req: Request, res: Response) {
    try {
      if (!stripeService) {
        return res.status(503).json({ error: 'Stripe service not configured' });
      }

      const signature = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature || !webhookSecret) {
        logger.error('Missing Stripe signature or webhook secret');
        return res.status(400).json({ error: 'Missing signature or webhook secret' });
      }

      let event;
      try {
        event = stripeService.stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err) {
        logger.error('Webhook signature verification failed', { error: err });
        return res.status(400).json({ error: 'Invalid signature' });
      }

      await stripeService.handleWebhook(event);
      
      logger.info(`Webhook processed successfully`, { eventType: event.type, eventId: event.id });
      res.json({ received: true });
    } catch (error) {
      logger.error('Error handling webhook', { error });
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  static async checkPremiumAccess(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const subscription = await SubscriptionRepository.findByUserId(userId);
      
      const hasAccess = subscription && (
        subscription.status === 'active' || 
        subscription.plan === 'trial'
      );

      res.json({ 
        hasAccess,
        subscription: subscription ? {
          status: subscription.status,
          plan: subscription.plan,
          currentPeriodEnd: subscription.current_period_end
        } : null
      });
    } catch (error) {
      logger.error('Error checking premium access', { error, userId: req.user?.id });
      res.status(500).json({ error: 'Failed to check premium access' });
    }
  }
}
