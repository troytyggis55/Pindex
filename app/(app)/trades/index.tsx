import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { Trade, TradeItem, Pin } from '@/types'

type Profile = { id: string; username: string }
type ContactRow = { id: string; name: string }
type TradeWithDetails = Trade & {
  initiator: Profile
  receiver_profile: Profile | null
  receiver_contact: ContactRow | null
  trade_items: Array<TradeItem & { pin: Pick<Pin, 'id' | 'name'> }>
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
        receiver_profile:profiles!trades_receiver_profile_id_fkey(id, username),
        receiver_contact:contacts!trades_receiver_contact_id_fkey(id, name),
        trade_items(id, side, pin:pins(id, name))
      `)
      .or(`initiator_id.eq.${session.user.id},receiver_profile_id.eq.${session.user.id}`)
      .order('confirmed_at', { ascending: false, nullsFirst: true })
    if (!error && data) setTrades(data as TradeWithDetails[])
    setLoading(false)
    setRefreshing(false)
  }

  useFocusEffect(useCallback(() => { fetchTrades() }, []))

  const onRefresh = () => { setRefreshing(true); fetchTrades() }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  const renderTrade = ({ item }: { item: TradeWithDetails }) => {
    const myId = session!.user.id
    const isInitiator = item.initiator_id === myId

    const partnerName = isInitiator
      ? (item.receiver_profile?.username ?? item.receiver_contact?.name ?? '?')
      : item.initiator.username

    const gave = item.trade_items.filter(t => isInitiator ? t.side === 'gave' : t.side === 'received')
    const received = item.trade_items.filter(t => isInitiator ? t.side === 'received' : t.side === 'gave')

    const isUnconfirmed = item.status === 'unconfirmed'

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(app)/trades/${item.id}`)}
        style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 12 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontWeight: '600' }}>{partnerName}</Text>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: isUnconfirmed ? '#fef9c3' : '#dcfce7',
          }}>
            <Text style={{ fontSize: 12, color: isUnconfirmed ? '#854d0e' : '#166534' }}>
              {isUnconfirmed ? 'Unconfirmed' : 'Confirmed'}
            </Text>
          </View>
        </View>
        <Text style={{ color: '#555', fontSize: 13 }}>
          Gave: {gave.map(t => t.pin.name).join(', ') || '—'}
        </Text>
        <Text style={{ color: '#555', fontSize: 13 }}>
          Received: {received.map(t => t.pin.name).join(', ') || '—'}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      data={trades}
      keyExtractor={t => t.id}
      ListHeaderComponent={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Trades</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/trades/new')}
            style={{ backgroundColor: '#000', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>+ Record</Text>
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
          No trades recorded yet. Tap "+ Record" to log a trade.
        </Text>
      }
      renderItem={renderTrade}
    />
  )
}
