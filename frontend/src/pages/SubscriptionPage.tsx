import { Box, Stack, Typography } from '@mui/material'
import { SubscriptionPlans, SubscriptionStatus } from '../components/subscriptions'
import { useSubscription } from '../hooks/useSubscription'

export function SubscriptionPage() {
  const { data, isLoading, error, refresh } = useSubscription()

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Подписка
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управляй статусом и выбирай план, который подходит.
        </Typography>
      </Box>
      <SubscriptionStatus subscription={data} isLoading={isLoading} error={error} onRefresh={refresh} />
      <SubscriptionPlans currentPlan={data?.plan ?? null} isPremium={data?.isPremium ?? false} isLoading={isLoading} />
    </Stack>
  )
}


