import { useCallback } from 'react'
import { Text, View, FlatList, ActivityIndicator, RefreshControl, type FlatListProps, type ListRenderItem } from 'react-native'
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

// TODO: When doing search, we want the already loaded pins to be filterered properly, while the remaing non loaded pins should be fetched in the backend with a loading icon.
// Sentinel id prefix for the invisible cells used to pad a short last row so
// real items keep their exact 1/numColumns width and stay left-aligned.
const SPACER_PREFIX = '__spacer_'

export function InfiniteList<T extends { id: string }>({
  buildQuery,
  pageSize,
  refetchOnFocus = true,
  emptyText = 'Nothing found.',
  keyExtractor,
  numColumns,
  renderItem,
  ...flatListProps
}: InfiniteListProps<T>) {
  const { items, loading, loadingMore, refreshing, hasMore, load, refresh, loadMore } =
    useInfiniteQuery<T>({ buildQuery, pageSize })

  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus) load()
    }, [refetchOnFocus, load])
  )

  // Pad the last row with spacer cells so a partial row fills from the left
  // instead of stretching its items across the full width.
  const cols = numColumns ?? 1
  const remainder = cols > 1 ? items.length % cols : 0
  const data =
    remainder === 0
      ? items
      : [
          ...items,
          ...Array.from(
            { length: cols - remainder },
            (_, i) => ({ id: `${SPACER_PREFIX}${i}` } as T)
          ),
        ]

  const renderCell: ListRenderItem<T> = (info) =>
    info.item.id.startsWith(SPACER_PREFIX) ? <View className="flex-1" /> : renderItem?.(info) ?? null

  return (
    <FlatList
      data={data}
      numColumns={numColumns}
      renderItem={renderCell}
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