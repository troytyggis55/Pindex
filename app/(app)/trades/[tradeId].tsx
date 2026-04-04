import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
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

export default function TradeDetailScreen() {
  const { tradeId } = useLocalSearchParams<{ tradeId: string }>()
  const { session } = useAuth()
  const router = useRouter()
  const [trade, setTrade] = useState<TradeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!tradeId) return
    supabase
      .from('trades')
      .select(`
        *,
        initiator:profiles!trades_initiator_id_fkey(id, username),
        receiver_profile:profiles!trades_receiver_profile_id_fkey(id, username),
        receiver_contact:contacts!trades_receiver_contact_id_fkey(id, name),
        trade_items(id, side, pin:pins(id, name))
      `)
      .eq('id', tradeId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setTrade(data as TradeWithDetails)
        setLoading(false)
      })
  }, [tradeId])

  const confirmTrade = async () => {
    setConfirming(true)
    const { error } = await supabase
      .from('trades')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', tradeId)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setTrade(prev => prev ? { ...prev, status: 'confirmed', confirmed_at: new Date().toISOString() } : null)
    }
    setConfirming(false)
  }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  if (!trade) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Trade not found</Text></View>
  }

  if (!session) return null

  const myId = session.user.id
  const isInitiator = trade.initiator_id === myId
  const isReceiver = trade.receiver_profile_id === myId
  const canConfirm = isReceiver && trade.status === 'unconfirmed'

  const partnerName = isInitiator
    ? (trade.receiver_profile?.username ?? trade.receiver_contact?.name ?? '?')
    : trade.initiator.username

  // Items from the viewer's perspective
  const gave = trade.trade_items.filter(t => isInitiator ? t.side === 'gave' : t.side === 'received')
  const received = trade.trade_items.filter(t => isInitiator ? t.side === 'received' : t.side === 'gave')

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Trade with {partnerName}</Text>
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          backgroundColor: trade.status === 'unconfirmed' ? '#fef9c3' : '#dcfce7',
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: trade.status === 'unconfirmed' ? '#854d0e' : '#166534' }}>
            {trade.status === 'unconfirmed' ? 'Unconfirmed' : 'Confirmed'}
          </Text>
        </View>
      </View>

      {trade.confirmed_at && (
        <Text style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
          Confirmed {new Date(trade.confirmed_at).toLocaleDateString()}
        </Text>
      )}

      <View style={{ marginBottom: 20, marginTop: 16 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>You gave</Text>
        {gave.length === 0 ? (
          <Text style={{ color: '#888' }}>Nothing</Text>
        ) : (
          gave.map(item => (
            <View key={item.id} style={{ paddingVertical: 4 }}>
              <Text>• {item.pin.name}</Text>
            </View>
          ))
        )}
      </View>

      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>You received</Text>
        {received.length === 0 ? (
          <Text style={{ color: '#888' }}>Nothing</Text>
        ) : (
          received.map(item => (
            <View key={item.id} style={{ paddingVertical: 4 }}>
              <Text>• {item.pin.name}</Text>
            </View>
          ))
        )}
      </View>

      {canConfirm && (
        <TouchableOpacity
          onPress={() => Alert.alert('Confirm trade', 'Confirm that this trade happened?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: confirmTrade },
          ])}
          disabled={confirming}
          style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff' }}>Confirm trade</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}
