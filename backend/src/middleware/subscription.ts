import { Request, Response, NextFunction } from 'express';
import { SubscriptionRepository } from '../models/subscription.repository.js';
import { logger } from '../utils/logger.js';

export const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const subscription = await SubscriptionRepository.findByUserId(userId);
    
    if (!subscription) {
      logger.info(`No subscription found for user ${userId}`);
      return res.status(403).json({ 
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    const isActive = subscription.status === 'active';
    const isTrial = subscription.plan === 'trial';
    
    if (!isActive && !isTrial) {
      logger.info(`Inactive subscription for user ${userId}`, { 
        status: subscription.status,
        plan: subscription.plan 
      });
      return res.status(403).json({ 
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_INACTIVE',
        subscription: {
          status: subscription.status,
          plan: subscription.plan,
          currentPeriodEnd: subscription.current_period_end
        }
      });
    }

    // Add subscription info to request for use in controllers
    req.subscription = subscription || undefined;
    next();
  } catch (error) {
    logger.error('Error checking subscription', { error, userId: req.user?.id });
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

export const requirePremiumAccess = async (req: Request, res: Response, next: NextFunction) => {
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

    if (!hasAccess) {
      logger.info(`No premium access for user ${userId}`, { 
        subscription: subscription ? {
          status: subscription.status,
          plan: subscription.plan
        } : null
      });
      return res.status(403).json({ 
        error: 'Premium access required',
        code: 'PREMIUM_REQUIRED'
      });
    }

    req.subscription = subscription || undefined;
    next();
  } catch (error) {
    logger.error('Error checking premium access', { error, userId: req.user?.id });
    res.status(500).json({ error: 'Failed to verify premium access' });
  }
};

export const optionalSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      const subscription = await SubscriptionRepository.findByUserId(userId);
      req.subscription = subscription || undefined;
    }
    next();
  } catch (error) {
    logger.error('Error getting optional subscription', { error, userId: req.user?.id });
    // Don't fail the request, just continue without subscription info
    next();
  }
};
