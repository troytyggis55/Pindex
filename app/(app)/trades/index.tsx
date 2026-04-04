import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { Trade, TradeItem, Pin } from '@/types'

type Profile = { id: string; username: string }
type TradeWithDetails = Trade & {
  initiator: Profile
  receiver: Profile
  trade_items: Array<TradeItem & { pin: Pick<Pin, 'id' | 'name'> }>
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function TradesScreen() {
  const { session } = useAuth()
  const router = useRouter()
  const [trades, setTrades] = useState<TradeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTrades = async () => {
    if (!session?.user) return
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        initiator:profiles!trades_initiator_id_fkey(id, username),
        receiver:profiles!trades_receiver_id_fkey(id, username),
        trade_items(id, side, owner_id, pin:pins(id, name))
      `)
      .or(`initiator_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
    if (!error && data) setTrades(data as TradeWithDetails[])
    setLoading(false)
    setRefreshing(false)
  }

  useFocusEffect(useCallback(() => { fetchTrades() }, []))

  const onRefresh = () => { setRefreshing(true); fetchTrades() }

  const incoming = trades.filter(
    t => t.receiver_id === session?.user.id && t.status === 'pending'
  )
  const others = trades.filter(
    t => !(t.receiver_id === session?.user.id && t.status === 'pending')
  )

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  const renderTrade = ({ item }: { item: TradeWithDetails }) => {
    const myId = session!.user.id
    const isInitiator = item.initiator_id === myId
    const counterparty = isInitiator ? item.receiver : item.initiator
    const offered = item.trade_items.filter(t => t.side === 'offered')
    const requested = item.trade_items.filter(t => t.side === 'requested')

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(app)/trades/${item.id}`)}
        style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 12 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontWeight: '600' }}>
            {isInitiator ? `To: ${counterparty.username}` : `From: ${counterparty.username}`}
          </Text>
          <Text style={{ color: '#555', fontSize: 13 }}>{STATUS_LABEL[item.status] ?? item.status}</Text>
        </View>
        <Text style={{ color: '#555', fontSize: 13 }}>
          You offer: {offered.map(t => t.pin.name).join(', ') || '—'}
        </Text>
        <Text style={{ color: '#555', fontSize: 13 }}>
          You want: {requested.map(t => t.pin.name).join(', ') || '—'}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      data={others}
      keyExtractor={t => t.id}
      ListHeaderComponent={
        <>
          {incoming.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
                Incoming requests ({incoming.length})
              </Text>
              {incoming.map(t => renderTrade({ item: t }))}
            </View>
          )}

          {others.length > 0 && (
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>All trades</Text>
          )}
        </>
      }
      ListEmptyComponent={
        incoming.length === 0 ? (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
            No trades yet. Browse the Explore tab to find pins and users to trade with.
          </Text>
        ) : null
      }
      renderItem={renderTrade}
    />
  )
}
