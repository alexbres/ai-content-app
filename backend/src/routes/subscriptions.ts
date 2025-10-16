import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller.js';
import { requireAuth, extractUser } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';

const router = Router();

// Webhook endpoint (no auth required)
router.post('/webhook', SubscriptionController.handleWebhook);

// All other subscription routes require authentication
router.use(requireAuth);
router.use(extractUser);

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
