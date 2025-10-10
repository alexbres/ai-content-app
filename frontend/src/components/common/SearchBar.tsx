import { useEffect, useMemo, useRef } from 'react'
import { TextField, InputAdornment, IconButton, CircularProgress } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

type Props = {
  value: string
  onChange: (v: string) => void
  onSearch?: (v: string) => void
  placeholder?: string
  loading?: boolean
}

export function SearchBar({ value, onChange, onSearch, placeholder = 'Search…', loading }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleEnter = () => onSearch?.(value)
  const handleEscape = () => onChange('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleEnter()
      if (e.key === 'Escape') handleEscape()
    }
    const el = inputRef.current
    if (!el) return
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [value])

  const endAdornment = useMemo(() => (
    <InputAdornment position="end">
      {loading ? (
        <CircularProgress size={18} />
      ) : value ? (
        <IconButton aria-label="Clear" size="small" onClick={() => onChange('')}>
          <ClearIcon fontSize="small" />
        </IconButton>
      ) : null}
    </InputAdornment>
  ), [loading, value, onChange])

  return (
    <TextField
      inputRef={inputRef}
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment,
      }}
    />
  )
}

export default SearchBar


