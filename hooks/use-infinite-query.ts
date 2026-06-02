import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// Whatever .select() returns — a chainable, awaitable query builder.
type SelectBuilder = ReturnType<ReturnType<typeof supabase.from>['select']>

interface Options<T> {
  // Build the base query: table, columns, ordering. Do NOT add .range() here.
  buildQuery: (sb: typeof supabase) => SelectBuilder
  pageSize?: number
}

export function useInfiniteQuery<T>({ buildQuery, pageSize = 24 }: Options<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)      // initial load only
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const fetchPage = useCallback(async (pageIndex: number, replace: boolean) => {
    const from = pageIndex * pageSize
    const { data, error } = await buildQuery(supabase).range(from, from + pageSize - 1)

    if (!error && data) {
      const rows = data as T[]
      setItems(prev => (replace ? rows : [...prev, ...rows]))
      setHasMore(rows.length === pageSize)   // a short page means we hit the end
    }

    setLoading(false)
    setLoadingMore(false)
    setRefreshing(false)
  }, [buildQuery, pageSize])

  // Page index is derived from how many items we already hold — no separate state to desync.
  const load = useCallback(() => {
    setLoading(true); setHasMore(true)
    fetchPage(0, true)
  }, [fetchPage])

  const refresh = useCallback(() => {
    setRefreshing(true); setHasMore(true)
    fetchPage(0, true)
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMore) return
    setLoadingMore(true)
    fetchPage(Math.floor(items.length / pageSize), false)
  }, [loading, loadingMore, refreshing, hasMore, items.length, pageSize, fetchPage])

  return { items, loading, loadingMore, refreshing, hasMore, load, refresh, loadMore }
}