import { useEffect, useMemo, useState } from 'react'
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid'
import { Box, Button, Chip, IconButton, MenuItem, Select, Stack, TextField, Toolbar } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import ArchiveIcon from '@mui/icons-material/Archive'
import DeleteIcon from '@mui/icons-material/Delete'
import { listPosts, updatePost, archivePost } from '../../services/posts'
import type { PostModel, PostStatus } from '../../types/auth'
import { useNavigate } from 'react-router-dom'

export function PostsManagement() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<PostModel[]>([])
  const [loading, setLoading] = useState(false)
  const [selection, setSelection] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>('')
  const [labelsFilter, setLabelsFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await listPosts({ status: statusFilter || undefined, labels: labelsFilter ? labelsFilter.split(',').map((s) => s.trim()).filter(Boolean) : undefined, search })
      setRows(res.posts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [statusFilter, labelsFilter, search])

  const onInlineStatusChange = async (id: number, status: PostStatus) => {
    const updated = await updatePost(id, { status })
    setRows((rs) => rs.map((r) => (r.id === id ? updated : r)))
  }

  const bulkArchive = async () => {
    await Promise.all(selection.map((id) => archivePost(id)))
    fetchData()
  }
  const bulkDelete = async () => {
    await Promise.all(selection.map((id) => archivePost(id)))
    fetchData()
  }
  const bulkChangeStatus = async (status: PostStatus) => {
    await Promise.all(selection.map((id) => updatePost(id, { status })))
    fetchData()
  }

  const columns = useMemo<GridColDef<PostModel>[]>(() => [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 180 },
    { field: 'status', headerName: 'Status', width: 150, renderCell: (p) => (
      <Select size="small" value={p.row.status} onChange={(e) => onInlineStatusChange(p.row.id, e.target.value as PostStatus)}>
        <MenuItem value="draft">draft</MenuItem>
        <MenuItem value="published">published</MenuItem>
        <MenuItem value="archived">archived</MenuItem>
      </Select>
    ) },
    { field: 'labels', headerName: 'Labels', flex: 1, minWidth: 200, renderCell: (p) => (
      <Stack direction="row" spacing={0.5} overflow="hidden">
        {p.row.labels?.map((l: string) => <Chip key={l} size="small" label={l} />)}
      </Stack>
    ) },
    { field: 'created_at', headerName: 'Created', width: 180, renderCell: (p) => new Date(p.row.created_at).toLocaleString() },
    { field: 'actions', headerName: 'Actions', width: 140, sortable: false, filterable: false, renderCell: (p) => (
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" onClick={() => navigate(`/admin/posts/${p.row.id}/edit`)}><EditIcon fontSize="small" /></IconButton>
        <IconButton size="small" onClick={() => onInlineStatusChange(p.row.id, 'archived')}><ArchiveIcon fontSize="small" /></IconButton>
      </Stack>
    ) },
  ], [])

  return (
    <Box>
      <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select size="small" displayEmpty value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <MenuItem value=""><em>All statuses</em></MenuItem>
          <MenuItem value="draft">draft</MenuItem>
          <MenuItem value="published">published</MenuItem>
          <MenuItem value="archived">archived</MenuItem>
        </Select>
        <TextField size="small" placeholder="label1,label2" value={labelsFilter} onChange={(e) => setLabelsFilter(e.target.value)} />
        <Button variant="outlined" onClick={() => navigate('/admin/posts/new')}>New Post</Button>
        <Box sx={{ flex: 1 }} />
        <Button color="warning" onClick={bulkArchive} disabled={!selection.length} startIcon={<ArchiveIcon />}>Archive</Button>
        <Button color="error" onClick={bulkDelete} disabled={!selection.length} startIcon={<DeleteIcon />}>Delete</Button>
        <Button onClick={() => bulkChangeStatus('published')} disabled={!selection.length}>Mark Published</Button>
        <Button onClick={() => bulkChangeStatus('draft')} disabled={!selection.length}>Mark Draft</Button>
      </Toolbar>
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          checkboxSelection
          getRowId={(r) => r.id}
          loading={loading}
          onRowSelectionModelChange={(model) => setSelection(model as unknown as number[])}
          slots={{ toolbar: GridToolbar }}
        />
      </div>
    </Box>
  )
}

export default PostsManagement


