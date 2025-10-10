import { useCallback, useEffect, useMemo, useState } from 'react'
import useDebouncedValue from './useDebouncedValue'
import { useUrlSync } from './useUrlSync'

export type PostsFilters = {
  search: string
  labels: string[]
  favorites: boolean
  premium: boolean
}

const DEFAULTS: PostsFilters = { search: '', labels: [], favorites: false, premium: false }

export function usePostsFilters() {
  const { read, write } = useUrlSync()
  const [filters, setFilters] = useState<PostsFilters>(DEFAULTS)

  // initialize from URL on mount
  useEffect(() => {
    const params = read()
    const init: PostsFilters = {
      search: params.search || '',
      labels: params.labels ? params.labels.split(',').filter(Boolean) : [],
      favorites: params.fav === '1' || params.favorites === '1',
      premium: params.premium === '1',
    }
    setFilters((prev) => ({ ...prev, ...init }))
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // debounced search to avoid thrashing
  const debouncedSearch = useDebouncedValue(filters.search, 300)

  // sync URL when filters change (debounce search only)
  useEffect(() => {
    write({
      search: debouncedSearch,
      labels: filters.labels,
      fav: filters.favorites,
      premium: filters.premium,
    }, { replace: true })
  }, [debouncedSearch, filters.labels, filters.favorites, filters.premium, write])

  const setSearch = useCallback((v: string) => setFilters((f) => ({ ...f, search: v })), [])
  const setLabels = useCallback((labels: string[]) => setFilters((f) => ({ ...f, labels })), [])
  const setFavorites = useCallback((favorites: boolean) => setFilters((f) => ({ ...f, favorites })), [])
  const setPremium = useCallback((premium: boolean) => setFilters((f) => ({ ...f, premium })), [])
  const reset = useCallback(() => setFilters(DEFAULTS), [])

  const effective = useMemo<PostsFilters>(() => ({
    search: debouncedSearch,
    labels: filters.labels,
    favorites: filters.favorites,
    premium: filters.premium,
  }), [debouncedSearch, filters.labels, filters.favorites, filters.premium])

  return { filters, setSearch, setLabels, setFavorites, setPremium, reset, effective }
}

export default usePostsFilters


