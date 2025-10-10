import { useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { SearchBar, FilterPanel } from '../components/common'
import { PostList } from '../components/posts'
import { usePostsFilters } from '../hooks/usePostsFilters'
import { useNavigate } from 'react-router-dom'

export function PostsPage() {
  const { filters, effective, setSearch, setLabels, setFavorites, setPremium, reset } = usePostsFilters()
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <SearchBar value={filters.search} onChange={setSearch} />
          <Typography variant="body2" color="text.secondary">Найдено {total} постов</Typography>
        </Stack>
        <FilterPanel
          labelsOptions={[]}
          labels={filters.labels}
          onChangeLabels={setLabels}
          favorites={filters.favorites}
          onToggleFavorites={setFavorites}
          premium={filters.premium}
          onTogglePremium={setPremium}
          onReset={reset}
        />
      </Stack>
      <PostList filters={effective} onPageInfo={({ total }) => setTotal(total)} onOpenPost={(id) => navigate(`/posts/${id}`)} />
    </Box>
  )
}

export default PostsPage


