import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Box, Button, Chip, Divider, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography } from '@mui/material'
import { createPost, getPost, updatePost, type CreatePostInput, type UpdatePostInput } from '../../services/posts'
import type { PostModel, PostStatus } from '../../types/auth'
import MarkdownEditor from './MarkdownEditor'
import MediaUpload from './MediaUpload'
import { useNavigate } from 'react-router-dom'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  preview: z.string().optional().nullable(),
  labels: z.array(z.string()).max(10),
  is_premium: z.boolean().default(false),
  status: z.union([z.literal('draft'), z.literal('published'), z.literal('archived')]).default('draft'),
})

type FormData = z.infer<typeof formSchema>

type Props = {
  postId?: number
}

export function PostEditor({ postId }: Props) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<boolean>(Boolean(postId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [labelsInput, setLabelsInput] = useState('')
  const [image, setImage] = useState<{ file?: File; url?: string; alt?: string } | null>(null)

  const [form, setForm] = useState<FormData>({ title: '', content: '', preview: '', labels: [], is_premium: false, status: 'draft' })

  useEffect(() => {
    let active = true
    if (!postId) return
    ;(async () => {
      try {
        const post = await getPost(postId)
        if (!active) return
        setForm({
          title: post.title,
          content: post.content,
          preview: post.preview ?? '',
          labels: post.labels || [],
          is_premium: Boolean(post.is_premium),
          status: post.status,
        })
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
    return () => { active = false }
  }, [postId])

  const onChange = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const onAddLabel = () => {
    const t = labelsInput.trim()
    if (!t) return
    if (form.labels.includes(t)) return
    onChange('labels', [...form.labels, t])
    setLabelsInput('')
  }

  const onDeleteLabel = (t: string) => onChange('labels', form.labels.filter((x) => x !== t))

  const submit = async (publish = false) => {
    setError(null)
    const parsed = formSchema.safeParse({ ...form, status: publish ? 'published' : form.status })
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e: z.ZodIssue) => e.message).join(', ')
      setError(msg)
      return
    }
    setSaving(true)
    try {
      const payload: CreatePostInput | UpdatePostInput = { ...parsed.data }
      if (postId) {
        const updated = await updatePost(postId, payload)
        navigate(`/admin/posts/${updated.id}/edit`)
      } else {
        const created = await createPost(payload as CreatePostInput)
        navigate(`/admin/posts/${created.id}/edit`)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5">{postId ? 'Edit Post' : 'New Post'}</Typography>
      {error && (
        <Box sx={{ color: 'error.main' }}>{error}</Box>
      )}
      <TextField label="Title" value={form.title} onChange={(e) => onChange('title', e.target.value)} fullWidth />
      <TextField label="Preview" value={form.preview || ''} onChange={(e) => onChange('preview', e.target.value)} fullWidth />
      <FormControl fullWidth>
        <InputLabel id="status-label">Status</InputLabel>
        <Select labelId="status-label" label="Status" value={form.status} onChange={(e) => onChange('status', e.target.value as PostStatus)}>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="published">Published</MenuItem>
          <MenuItem value="archived">Archived</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel control={<Switch checked={form.is_premium} onChange={(e) => onChange('is_premium', e.target.checked)} />} label="Premium" />
      <Divider />
      <Typography variant="subtitle1">Content</Typography>
      <MarkdownEditor value={form.content} onChange={(v) => onChange('content', v)} autoSaveKey={postId ? `post:${postId}` : 'post:new'} />
      <Divider />
      <Typography variant="subtitle1">Labels</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {form.labels.map((l) => (
          <Chip key={l} label={l} onDelete={() => onDeleteLabel(l)} />
        ))}
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField label="Add label" value={labelsInput} onChange={(e) => setLabelsInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddLabel() } }} />
        <Button onClick={onAddLabel} variant="outlined">Add</Button>
      </Stack>
      <Divider />
      <Typography variant="subtitle1">Header Image</Typography>
      <MediaUpload value={image || undefined} onChange={setImage} />
      <Divider />
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={() => submit(false)} disabled={saving}>{postId ? 'Save' : 'Create Draft'}</Button>
        <Button variant="outlined" onClick={() => submit(true)} disabled={saving}>Publish</Button>
      </Stack>
    </Stack>
  )
}

export default PostEditor


