import { useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, RefreshControl, type FlatListProps } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useInfiniteQuery } from '@/hooks/use-infinite-query'

type SelectBuilder = ReturnType<ReturnType<typeof supabase.from>['select']>

// Take the standard FlatList props but drop the ones we own internally.
type PassthroughProps<T> = Omit<
  FlatListProps<T>,
  'data' | 'onEndReached' | 'refreshControl' | 'ListEmptyComponent' | 'ListFooterComponent'
>

interface InfiniteListProps<T> extends PassthroughProps<T> {
  buildQuery: (sb: typeof supabase) => SelectBuilder
  pageSize?: number
  refetchOnFocus?: boolean
  emptyText?: string
}

export function InfiniteList<T extends { id: string }>({
  buildQuery,
  pageSize,
  refetchOnFocus = true,
  emptyText = 'Nothing found.',
  keyExtractor,
  ...flatListProps
}: InfiniteListProps<T>) {
  const { items, loading, loadingMore, refreshing, hasMore, load, refresh, loadMore } =
    useInfiniteQuery<T>({ buildQuery, pageSize })

  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus) load()
    }, [refetchOnFocus, load])
  )

  return (
    <FlatList
      data={items}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      keyExtractor={keyExtractor ?? ((item) => item.id)}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator className="mt-10" />
        ) : (
          <Text className="font-monda text-gray-500 text-center mt-10">{emptyText}</Text>
        )
      }
      ListFooterComponent={loadingMore ? <ActivityIndicator className="my-4" /> : null}
      {...flatListProps}
    />
  )
}