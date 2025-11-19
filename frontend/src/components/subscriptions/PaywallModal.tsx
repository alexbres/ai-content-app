import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useMemo } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onSubscribe: () => void
  content?: string
  benefits?: string[]
  isLoading?: boolean
  title?: string
  previewParagraphs?: number
}

const defaultBenefits = ['Неограниченный доступ к premium', 'AI кредиты и экспорты', 'Приоритетные релизы']

export function PaywallModal({
  open,
  onClose,
  onSubscribe,
  content,
  benefits = defaultBenefits,
  isLoading,
  title = 'Premium доступ',
  previewParagraphs = 2,
}: Props) {
  const preview = useMemo(() => {
    if (!content) return []
    return content
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, previewParagraphs)
  }, [content, previewParagraphs])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" gap={1} alignItems="center">
          <LockIcon color="warning" />
          <span>{title}</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {preview.length ? (
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Превью
            </Typography>
            <Stack spacing={1.5}>
              {preview.map((paragraph, idx) => (
                <Typography key={idx} variant="body2">
                  {paragraph}
                </Typography>
              ))}
            </Stack>
          </Box>
        ) : null}
        <Divider />
        <Box mt={2}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Плюсы подписки
          </Typography>
          <List dense>
            {benefits.map((benefit) => (
              <ListItem key={benefit}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={benefit} />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Later
        </Button>
        <Button
          variant="contained"
          onClick={onSubscribe}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Подписаться
        </Button>
      </DialogActions>
    </Dialog>
  )
}


