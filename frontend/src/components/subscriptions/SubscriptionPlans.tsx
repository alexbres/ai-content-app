import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RecommendIcon from '@mui/icons-material/Recommend'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import CancelIcon from '@mui/icons-material/Cancel'
import { createCheckoutSession, getPlanPriceId, SubscriptionPlanId } from '../../services/subscriptionService'

type PlanConfig = {
  id: SubscriptionPlanId
  label: string
  sublabel: string
  description: string
  priceDisplay: string
  highlight?: boolean
  featureHighlights: string[]
  priceId?: string
  ctaLabel: string
}

type FeatureRow = {
  label: string
  values: Record<SubscriptionPlanId, boolean | string>
}

type Props = {
  currentPlan: SubscriptionPlanId | null
  isPremium?: boolean
  isLoading?: boolean
}

const planDefinitions: PlanConfig[] = [
  {
    id: 'trial',
    label: 'Trial',
    sublabel: '7 дней бесплатно',
    description: 'Протестируй все премиальные функции без оплаты и обязательств.',
    priceDisplay: '$0',
    featureHighlights: ['Полный доступ 7 дней', 'Нет привязки карты (если Stripe trial)'],
    priceId: getPlanPriceId('trial'),
    ctaLabel: 'Start Trial',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    sublabel: 'Гибкая подписка',
    description: 'Минимальная стоимость для тех, кто любит гибкость.',
    priceDisplay: '$0.99',
    featureHighlights: ['Неограниченный доступ', 'Ежемесячное списание в Stripe'],
    priceId: getPlanPriceId('monthly'),
    ctaLabel: 'Subscribe Monthly',
  },
  {
    id: 'yearly',
    label: 'Yearly',
    sublabel: 'Лучшее предложение',
    description: 'Плати один раз в год и экономь больше 15%.',
    priceDisplay: '$10',
    highlight: true,
    featureHighlights: ['Экономия vs monthly', 'Приоритетная поддержка'],
    priceId: getPlanPriceId('yearly'),
    ctaLabel: 'Unlock Yearly',
  },
]

const featureRows: FeatureRow[] = [
  {
    label: 'Premium контент',
    values: { trial: true, monthly: true, yearly: true },
  },
  {
    label: 'AI кредиты',
    values: { trial: '25', monthly: '100 / мес', yearly: '1200 / год' },
  },
  {
    label: 'Экспорт / API',
    values: { trial: false, monthly: true, yearly: true },
  },
  {
    label: 'Поддержка',
    values: { trial: 'Community', monthly: 'Standard', yearly: 'Priority' },
  },
]

export function SubscriptionPlans({ currentPlan, isPremium, isLoading }: Props) {
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlanId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const plans = useMemo(() => planDefinitions, [])

  const handleSubscribe = async (plan: PlanConfig) => {
    if (!plan.priceId) {
      setError('Stripe priceId не настроен для этого плана')
      return
    }
    setError(null)
    setPendingPlan(plan.id)
    try {
      await createCheckoutSession(plan.priceId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать checkout session')
      setPendingPlan(null)
    }
  }

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? <CheckCircleIcon color="success" fontSize="small" /> : <CancelIcon color="disabled" fontSize="small" />
    }
    return <Typography variant="body2">{value}</Typography>
  }

  return (
    <Box>
      <Typography variant="h5" mb={2}>
        Выбери план
      </Typography>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Grid container spacing={3}>
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id && isPremium
          const disabled = isLoading || pendingPlan === plan.id || isCurrent || !plan.priceId
          return (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderColor: plan.highlight ? 'secondary.main' : undefined,
                  borderWidth: plan.highlight ? 2 : undefined,
                }}
              >
                <CardHeader
                  avatar={plan.highlight ? <RecommendIcon color="secondary" /> : <StarOutlineIcon color="primary" />}
                  title={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6">{plan.label}</Typography>
                      {plan.highlight ? <Chip label="Best value" color="secondary" size="small" /> : null}
                      {isCurrent ? <Chip label="Текущий" size="small" color="success" /> : null}
                    </Box>
                  }
                  subheader={plan.sublabel}
                />
                <CardContent>
                  <Typography variant="h3" gutterBottom>
                    {plan.priceDisplay}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {plan.description}
                  </Typography>
                  <List dense>
                    {plan.featureHighlights.map((fh) => (
                      <ListItem key={fh}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={fh} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <Box px={2} pb={2}>
                  <Tooltip title={!plan.priceId ? 'Price ID отсутствует' : isCurrent ? 'Это твой текущий план' : ''}>
                    <span>
                      <Button
                        fullWidth
                        variant={plan.highlight ? 'contained' : 'outlined'}
                        color={plan.highlight ? 'secondary' : 'primary'}
                        disabled={disabled}
                        onClick={() => handleSubscribe(plan)}
                      >
                        {pendingPlan === plan.id ? <CircularProgress size={18} /> : plan.ctaLabel}
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          )
        })}
      </Grid>
      <Box mt={4}>
        <Typography variant="h6" mb={1}>
          Сравнение функций
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Функция</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} align="center">
                  {plan.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {featureRows.map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                {plans.map((plan) => (
                  <TableCell key={plan.id} align="center">
                    {renderFeatureValue(row.values[plan.id])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}


