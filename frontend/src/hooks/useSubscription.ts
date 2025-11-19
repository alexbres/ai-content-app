import { useAuth } from './useAuth'
import { useCallback, useEffect, useState } from 'react'
import { getSubscriptionStatus, SubscriptionStatusResponse } from '../services/subscriptionService'

type UseSubscriptionReturn = {
  data: SubscriptionStatusResponse | null
  status: string
  isPremium: boolean
  isTrial: boolean
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useSubscription(autoFetch = true): UseSubscriptionReturn {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<SubscriptionStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setData(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const status = await getSubscriptionStatus()
      setData(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!autoFetch) return
    if (authLoading) return

    if (!isAuthenticated) {
      setData(null)
      setIsLoading(false)
      return
    }

    void refresh()
  }, [autoFetch, authLoading, isAuthenticated, refresh])

  return {
    data,
    status: data?.status ?? 'none',
    isPremium: data?.isPremium ?? false,
    isTrial: data?.isTrial ?? false,
    isLoading,
    error,
    refresh,
  }
}


