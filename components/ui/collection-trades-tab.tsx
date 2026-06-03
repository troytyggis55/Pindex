import { useCallback, useState } from 'react'
import { View, Text } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { InfiniteList } from '@/components/infinite-list'
import { TradeCard } from '@/components/ui/trade-card'
import { Spacing } from '@/constants/theme'
import type { TradeWithDetails } from '@/types'

const TRADE_SELECT = `
  *,
  initiator:profiles!initiator_id(id, username, avatar_url),
  receiver_profile:profiles!receiver_profile_id(id, username, avatar_url),
  receiver_contact:contacts!receiver_contact_id(id, name),
  trade_items(id, side, pin:pins(id, name, image_url, organization_id, organization:organizations(color)))
`

export function CollectionTradesTab() {
  const router = useRouter()
  const { session } = useAuth()
  const myId = session!.user.id
  const [pending, setPending] = useState<TradeWithDetails[]>([])

  const loadPending = useCallback(async () => {
    const { data } = await supabase
      .from('trades')
      .select(TRADE_SELECT)
      .eq('receiver_profile_id', myId)
      .eq('status', 'unconfirmed')
      .order('confirmed_at', { ascending: false, nullsFirst: true })
    if (data) setPending(data as TradeWithDetails[])
  }, [myId])

  useFocusEffect(useCallback(() => { loadPending() }, [loadPending]))

  const buildQuery = useCallback(
    (sb: typeof supabase) =>
      sb.from('trades')
        .select(TRADE_SELECT)
        .or(`initiator_id.eq.${myId},and(receiver_profile_id.eq.${myId},status.eq.confirmed)`)
        .order('confirmed_at', { ascending: false, nullsFirst: true }),
    [myId]
  )

  const header = pending.length > 0 ? (
    <View className="mb-4">
      <Text className="font-monda-bold text-[13px] text-gray-500 mb-2" style={{ letterSpacing: 0.5 }}>
        AWAITING YOUR CONFIRMATION ({pending.length})
      </Text>
      {pending.map(t => (
        <View key={t.id} className="mb-2.5">
          <TradeCard
            trade={t}
            currentUserId={myId}
            isPending
            isLast
            onPress={() => router.push(`/trades/${t.id}`)}
          />
        </View>
      ))}
      <Text className="font-monda-bold text-[13px] text-gray-500 mt-2" style={{ letterSpacing: 0.5 }}>
        MY TRADES
      </Text>
    </View>
  ) : null

  return (
    <InfiniteList<TradeWithDetails>
      buildQuery={buildQuery}
      emptyText="No trades recorded yet."
      contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: Spacing.navOffset + 16 }}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <TradeCard
          trade={item}
          currentUserId={myId}
          isLast={false}
          onPress={() => router.push(`/trades/${item.id}`)}
        />
      )}
    />
  )
}
