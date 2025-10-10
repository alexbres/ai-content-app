import { useMemo, useState } from 'react'
import { Box, Collapse, Stack, Chip, Checkbox, FormControlLabel, Button, Autocomplete, TextField, Typography } from '@mui/material'

type Props = {
  labelsOptions: string[]
  labels: string[]
  onChangeLabels: (labels: string[]) => void
  favorites: boolean
  onToggleFavorites: (v: boolean) => void
  premium: boolean
  onTogglePremium: (v: boolean) => void
  onReset: () => void
}

export function FilterPanel({ labelsOptions, labels, onChangeLabels, favorites, onToggleFavorites, premium, onTogglePremium, onReset }: Props) {
  const [open, setOpen] = useState(true)

  const chips = useMemo(() => {
    const items: { key: string; label: string; onDelete: () => void }[] = []
    for (const l of labels) items.push({ key: `l:${l}`, label: l, onDelete: () => onChangeLabels(labels.filter((x) => x !== l)) })
    if (favorites) items.push({ key: 'fav', label: 'Favorites', onDelete: () => onToggleFavorites(false) })
    if (premium) items.push({ key: 'premium', label: 'Premium', onDelete: () => onTogglePremium(false) })
    return items
  }, [labels, favorites, premium, onChangeLabels, onToggleFavorites, onTogglePremium])

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Button size="small" variant="outlined" onClick={() => setOpen((v) => !v)}>{open ? 'Hide filters' : 'Show filters'}</Button>
        <Box sx={{ flex: 1 }} />
        {!!chips.length && <Button size="small" onClick={onReset}>Reset</Button>}
      </Stack>
      <Collapse in={open} unmountOnExit>
        <Stack spacing={1} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Autocomplete
            multiple
            options={labelsOptions}
            value={labels}
            onChange={(_, v) => onChangeLabels(v)}
            renderInput={(params) => <TextField {...params} size="small" label="Labels" placeholder="Select labels" />}
          />
          <Stack direction="row" spacing={2}>
            <FormControlLabel control={<Checkbox checked={favorites} onChange={(e) => onToggleFavorites(e.target.checked)} />} label="Only favorites" />
            <FormControlLabel control={<Checkbox checked={premium} onChange={(e) => onTogglePremium(e.target.checked)} />} label="Premium content" />
          </Stack>
        </Stack>
      </Collapse>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
        {chips.length ? chips.map((c) => <Chip key={c.key} label={c.label} onDelete={c.onDelete} />) : (
          <Typography variant="caption" color="text.secondary">Нет активных фильтров</Typography>
        )}
      </Stack>
    </Box>
  )
}

export default FilterPanel


