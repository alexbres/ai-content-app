import { useEffect, useMemo, useRef, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import MarkdownPreview from '@uiw/react-markdown-preview'
import rehypeSanitize from 'rehype-sanitize'
import { Box, IconButton, Stack, Tooltip } from '@mui/material'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import { clsx } from 'clsx'

type Props = {
  value: string
  onChange: (v: string) => void
  autoSaveKey?: string
}

export function MarkdownEditor({ value, onChange, autoSaveKey }: Props) {
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // autosave draft to localStorage
  useEffect(() => {
    if (!autoSaveKey) return
    const id = setTimeout(() => {
      try {
        localStorage.setItem(autoSaveKey, value || '')
      } catch {}
    }, 500)
    return () => clearTimeout(id)
  }, [value, autoSaveKey])

  useEffect(() => {
    if (!autoSaveKey) return
    try {
      const stored = localStorage.getItem(autoSaveKey)
      if (stored && !value) onChange(stored)
    } catch {}
  }, [])

  const toolbar = useMemo(() => (
    <Stack direction="row" spacing={1} sx={{ p: 1, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
      <Tooltip title={fullscreen ? 'Exit full screen' : 'Full screen'}>
        <IconButton size="small" onClick={() => setFullscreen((f) => !f)}>
          {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </Tooltip>
    </Stack>
  ), [fullscreen])

  return (
    <Box ref={containerRef} className={clsx(fullscreen && 'fullscreen')} sx={{ position: 'relative' }}>
      {toolbar}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, p: 1 }}>
        <Box data-color-mode="light">
          <MDEditor value={value} onChange={(v) => onChange(v || '')} height={480} textareaProps={{ placeholder: 'Write markdown...' }}
            previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
          />
        </Box>
        <Box data-color-mode="light">
          <MarkdownPreview source={value} rehypePlugins={[[rehypeSanitize]]} />
        </Box>
      </Box>
      <style>{`
        .fullscreen {
          position: fixed;
          inset: 0;
          background: white;
          z-index: 1200;
          overflow: auto;
        }
      `}</style>
    </Box>
  )
}

export default MarkdownEditor




