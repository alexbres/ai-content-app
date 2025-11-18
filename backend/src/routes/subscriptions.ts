import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller.js';
import { requireAuth, extractUser } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Webhook endpoint (no auth required)
router.post('/webhook', SubscriptionController.handleWebhook);

// All other subscription routes require authentication
router.use((req, res, next) => {
  logger.debug('Subscription routes: before requireAuth', { 
    path: req.path,
    hasAuthHeader: !!req.headers.authorization,
    authHeaderPrefix: req.headers.authorization?.substring(0, 20) + '...'
  });
  
  requireAuth(req, res, (err) => {
    if (err) {
      logger.error('requireAuth failed', {
        error: err instanceof Error ? err.message : String(err),
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        path: req.path,
        hasAuthHeader: !!req.headers.authorization
      });
    }
    next(err);
  });
});

router.use((req, res, next) => {
  logger.debug('Subscription routes: before extractUser', { path: req.path, user: (req as any).user });
  extractUser(req, res, next);
});

// Create checkout session
router.post('/checkout', SubscriptionController.createCheckoutSession);

// Create customer portal session
router.post('/portal', SubscriptionController.createCustomerPortalSession);

// Get subscription status
router.get('/status', SubscriptionController.getSubscriptionStatus);

// Cancel subscription
router.delete('/cancel', SubscriptionController.cancelSubscription);

// Check premium access
router.get('/premium-access', SubscriptionController.checkPremiumAccess);

export { router as subscriptionRoutes };
