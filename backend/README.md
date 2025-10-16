Run dev (after installing deps):

```bash
npm run dev
```

Build and start:

```bash
npm run build && npm start
```

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ai_content_app

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_MONTHLY=price_your_monthly_price_id
STRIPE_PRICE_ID_YEARLY=price_your_yearly_price_id

# Server
PORT=3001
NODE_ENV=development
```

## Stripe Setup

1. Create a Stripe account and get your API keys
2. Create products and prices in Stripe Dashboard
3. Set up webhooks pointing to `https://yourdomain.com/api/subscriptions/webhook`
4. Configure webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`


