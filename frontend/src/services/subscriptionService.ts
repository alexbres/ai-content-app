import { authedHttp } from './http'

export type SubscriptionPlanId = 'trial' | 'monthly' | 'yearly'

export type SubscriptionStatusResponse = {
  hasSubscription: boolean
  status: string
  plan: SubscriptionPlanId | null
  currentPeriodEnd: string | null
  isActive: boolean
  isTrial?: boolean
  isPremium?: boolean
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}

export type PremiumAccessResponse = {
  hasAccess: boolean
  subscription: {
    status: string
    plan: SubscriptionPlanId | null
    currentPeriodEnd: string | null
  } | null
}

const subscriptionClient = authedHttp

const resolveSuccessUrl = (path = '/subscription?checkout=success') =>
  new URL(path, window.location.origin).toString()

const resolveCancelUrl = (path = '/subscription?checkout=cancelled') =>
  new URL(path, window.location.origin).toString()

const resolveReturnUrl = (path = '/subscription') =>
  new URL(path, window.location.origin).toString()

export const getSubscriptionStatus = async (): Promise<SubscriptionStatusResponse> => {
  const { data } = await subscriptionClient.get('/subscriptions/status')
  return data as SubscriptionStatusResponse
}

export const cancelSubscription = async (): Promise<void> => {
  await subscriptionClient.delete('/subscriptions/cancel')
}

export const createCheckoutSession = async (priceId: string): Promise<void> => {
  const { data } = await subscriptionClient.post('/subscriptions/checkout', {
    priceId,
    successUrl: resolveSuccessUrl(),
    cancelUrl: resolveCancelUrl(),
  })

  if (data?.url) {
    window.location.href = data.url
  }
}

export const openCustomerPortal = async (): Promise<void> => {
  const { data } = await subscriptionClient.post('/subscriptions/portal', {
    returnUrl: resolveReturnUrl(),
  })

  if (data?.url) {
    window.location.href = data.url
  }
}

export const checkPremiumAccess = async (): Promise<PremiumAccessResponse> => {
  const { data } = await subscriptionClient.get('/subscriptions/premium-access')
  return data as PremiumAccessResponse
}

export const getPlanPriceId = (plan: SubscriptionPlanId): string | undefined => {
  const envKeyMap: Record<SubscriptionPlanId, string | undefined> = {
    trial: import.meta.env.VITE_STRIPE_TRIAL_PRICE_ID,
    monthly: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID,
    yearly: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID,
  }

  const value = envKeyMap[plan]
  return value && value.trim().length ? value : undefined
}


