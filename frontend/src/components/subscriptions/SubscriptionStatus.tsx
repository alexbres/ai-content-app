import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { cancelSubscription, openCustomerPortal, SubscriptionStatusResponse } from '../../services/subscriptionService'

type Props = {
  subscription: SubscriptionStatusResponse | null
  isLoading: boolean
  error?: string | null
  onRefresh?: () => Promise<void>
}

const statusColorMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  active: 'success',
  trialing: 'info',
  trial: 'info',
  past_due: 'warning',
  incomplete: 'warning',
  canceled: 'error',
  unpaid: 'error',
  none: 'default',
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' })

export function SubscriptionStatus({ subscription, isLoading, error, onRefresh }: Props) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const statusLabel = subscription?.status ?? 'none'
  const canManage = Boolean(subscription?.stripeCustomerId)
  const canCancel = Boolean(subscription?.stripeSubscriptionId)
  const hasSubscription = subscription?.hasSubscription

  const currentPlanLabel = useMemo(() => {
    if (!subscription?.plan) return 'Нет'
    if (subscription.plan === 'trial') return 'Trial'
    if (subscription.plan === 'monthly') return 'Monthly'
    if (subscription.plan === 'yearly') return 'Yearly'
    return subscription.plan
  }, [subscription?.plan])

  const formattedPeriodEnd = subscription?.currentPeriodEnd
    ? dateFormatter.format(new Date(subscription.currentPeriodEnd))
    : '—'

  const handlePortal = async () => {
    if (!canManage) return
    setLocalError(null)
    setPortalLoading(true)
    try {
      await openCustomerPortal()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не удалось открыть Customer Portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!canCancel) return
    setLocalError(null)
    setSuccessMessage(null)
    setCancelLoading(true)
    try {
      await cancelSubscription()
      setSuccessMessage('Подписка будет отменена. Заходи в портал для деталей.')
      if (onRefresh) {
        await onRefresh()
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не удалось отменить подписку')
    } finally {
      setCancelLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="30%" height={40} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rounded" height={46} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5">Статус подписки</Typography>
              <Typography variant="body2" color="text.secondary">
                Управляй планом и биллингом
              </Typography>
            </Box>
            <Chip
              color={statusColorMap[statusLabel] ?? 'default'}
              label={statusLabel.toUpperCase()}
              icon={statusLabel === 'active' ? <CheckCircleIcon /> : undefined}
            />
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {localError ? (
            <Alert severity="error" onClose={() => setLocalError(null)}>
              {localError}
            </Alert>
          ) : null}
          {successMessage ? (
            <Alert severity="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          ) : null}

          {!hasSubscription ? (
            <Alert severity="info">У тебя пока нет активной подписки. Выбери план ниже.</Alert>
          ) : (
            <>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      План
                    </Typography>
                    <Typography variant="h6">{currentPlanLabel}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      Следующий платёж
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body1">{formattedPeriodEnd}</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      Статус
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {subscription?.isPremium ? <CheckCircleIcon color="success" /> : <WarningAmberIcon color="warning" />}
                      <Typography variant="body1">
                        {subscription?.isPremium ? 'Активен' : 'Нет доступа'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
              <Divider />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  startIcon={
                    portalLoading ? <CircularProgress size={16} color="inherit" /> : <ManageAccountsIcon />
                  }
                  onClick={handlePortal}
                  disabled={!canManage || portalLoading}
                  endIcon={<OpenInNewIcon fontSize="small" />}
                >
                  Manage Subscription
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={cancelLoading ? <CircularProgress size={16} color="inherit" /> : <CancelOutlinedIcon />}
                  onClick={handleCancel}
                  disabled={!canCancel || cancelLoading}
                >
                  Cancel Subscription
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}


