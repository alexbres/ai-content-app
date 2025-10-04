import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import imageCompression from 'browser-image-compression'

type Props = {
  value?: { file?: File; url?: string; alt?: string }
  onChange: (value: { file?: File; url?: string; alt?: string } | null) => void
  maxWidth?: number
  maxHeight?: number
}

export function MediaUpload({ value, onChange, maxWidth = 1600, maxHeight = 900 }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value?.url)
  const [alt, setAlt] = useState<string>(value?.alt || '')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setAlt(value?.alt || '')
    setPreviewUrl(value?.url)
  }, [value?.alt, value?.url])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files[0]) return
    const file = files[0]
    const compressed = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      useWebWorker: true,
      initialQuality: 0.8,
    })
    const url = URL.createObjectURL(compressed)
    setPreviewUrl(url)
    onChange({ file: compressed, url, alt })
  }, [onChange, alt, maxWidth, maxHeight])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDelete = () => {
    setPreviewUrl(undefined)
    setAlt('')
    onChange(null)
  }

  return (
    <Stack spacing={1}>
      <Box
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
        onDrop={onDrop}
        sx={{
          p: 2,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Typography variant="body2">Drag & drop or click to upload</Typography>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
      </Box>
      {previewUrl && (
        <Box>
          <img src={previewUrl} alt={alt} style={{ maxWidth: '100%', display: 'block', borderRadius: 8 }} />
        </Box>
      )}
      <TextField label="Alt text" value={alt} onChange={(e) => { setAlt(e.target.value); onChange({ ...value, alt: e.target.value } as any) }} />
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" color="error" onClick={onDelete} disabled={!previewUrl}>Delete</Button>
      </Stack>
    </Stack>
  )
}

export default MediaUpload




