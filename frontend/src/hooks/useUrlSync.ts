import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export type UrlParams = Record<string, string | string[] | undefined | null | boolean | number>

function toSearchParams(params: UrlParams): URLSearchParams {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([key, raw]) => {
    if (raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0)) return
    if (Array.isArray(raw)) {
      sp.set(key, raw.join(','))
    } else if (typeof raw === 'boolean') {
      if (raw) sp.set(key, '1')
    } else {
      sp.set(key, String(raw))
    }
  })
  return sp
}

function fromSearchParams(search: string): Record<string, string> {
  const sp = new URLSearchParams(search)
  const obj: Record<string, string> = {}
  sp.forEach((v, k) => { obj[k] = v })
  return obj
}

export function useUrlSync() {
  const navigate = useNavigate()
  const location = useLocation()

  const read = useCallback(() => fromSearchParams(location.search), [location.search])

  const write = useCallback((params: UrlParams, options?: { replace?: boolean }) => {
    const next = toSearchParams(params).toString()
    const path = `${location.pathname}${next ? `?${next}` : ''}`
    navigate(path, { replace: options?.replace ?? true })
  }, [location.pathname, navigate])

  return { read, write }
}

export default useUrlSync


