import { useCallback } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { InfiniteList } from '@/components/infinite-list'
import { PinCard } from '@/components/ui/pin-card'
import { Spacing } from '@/constants/theme'
import type { CollectionItem } from '@/types'

export function CollectionPinsTab() {
  const router = useRouter()
  const { session } = useAuth()
  const myId = session!.user.id

  const buildQuery = useCallback(
    (sb: typeof supabase) =>
      sb.from('user_pins')
        .select('*, pin:pins(*, organization:organizations(*))')
        .eq('user_id', myId)
        .order('acquired_at', { ascending: false }),
    [myId]
  )

  return (
    <InfiniteList<CollectionItem>
      buildQuery={buildQuery}
      emptyText="No pins yet — browse Explore to add some!"
      numColumns={3}
      columnWrapperStyle={{ gap: Spacing.gridGap, paddingHorizontal: Spacing.screenPad }}
      contentContainerStyle={{ paddingTop: 24, paddingBottom: Spacing.navOffset + 16, gap: 16 }}
      renderItem={({ item }) => (
        <View className="flex-1">
          <PinCard
            id={item.id}
            name={item.pin.name}
            imageUrl={item.pin.image_url}
            orgColor={item.pin.organization?.color}
            orgLogoUrl={item.pin.organization?.logo_url}
            isConfirmed={item.pin.organization_id != null}
            flags={{
              in_collection: item.in_collection,
              wishlisted: item.wishlisted,
              want_to_trade: item.want_to_trade,
            }}
            onPress={() => router.push(`/pins/${item.pin_id}`)}
          />
        </View>
      )}
    />
  )
}
