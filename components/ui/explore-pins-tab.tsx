import { useCallback, useMemo, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { PinCard } from '@/components/ui/pin-card'
import { Spacing } from '@/constants/theme'
import type { PinWithOrg } from '@/types'

export interface ExplorePinsTabProps {
  query: string
}

export function ExplorePinsTab({ query }: ExplorePinsTabProps) {
  const router = useRouter()
  const [pins, setPins] = useState<PinWithOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('pins')
      .select('*, organization:organizations(*)')
      .order('created_at', { ascending: false })
    if (data) setPins(data as PinWithOrg[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  const q = query.trim().toLowerCase()
  const data = useMemo(() => (q ? pins.filter(p => p.name.toLowerCase().includes(q)) : pins), [pins, q])

  return (
    <FlatList
      data={data}
      numColumns={3}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyExtractor={p => p.id}
      keyboardShouldPersistTaps="handled"
      columnWrapperStyle={{ gap: Spacing.gridGap, paddingHorizontal: Spacing.screenPad }}
      contentContainerStyle={{ paddingTop: 24, paddingBottom: Spacing.navOffset + 16, gap: 16 }}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator className="mt-10" />
        ) : (
          <Text className="font-monda text-gray-500 text-center mt-10">No pins found.</Text>
        )
      }
      renderItem={({ item }) => (
        <View className="flex-1">
          <PinCard
            id={item.id}
            name={item.name}
            imageUrl={item.image_url}
            orgColor={item.organization?.color}
            orgLogoUrl={item.organization?.logo_url}
            isConfirmed={item.organization_id != null}
            onPress={() => router.push(`/pins/${item.id}`)}
          />
        </View>
      )}
    />
  )
}
