import { useCallback } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { InfiniteList } from '@/components/infinite-list'
import { PinCard } from '@/components/ui/pin-card'
import { Spacing } from '@/constants/theme'
import type { PinWithOrg } from '@/types'

export interface ExplorePinsTabProps {
  query: string
}

export function ExplorePinsTab({ query }: ExplorePinsTabProps) {
  const router = useRouter()

  const buildQuery = useCallback(
    (sb: typeof supabase) =>
      sb.from('pins')
        .select('*, organization:organizations(*)')
        .order('created_at', { ascending: false }),
    []
  )

  return (
    <InfiniteList<PinWithOrg>
      buildQuery={buildQuery}
      emptyText="No pins found."
      pageSize={24}
      numColumns={3}
      columnWrapperStyle={{ gap: Spacing.gridGap, paddingHorizontal: Spacing.screenPad }}
      contentContainerStyle={{ paddingTop: 24, paddingBottom: Spacing.navOffset + 16, gap: 16 }}
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