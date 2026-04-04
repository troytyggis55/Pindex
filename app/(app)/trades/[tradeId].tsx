import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { Trade, TradeItem, Pin } from '@/types'

type Profile = { id: string; username: string }
type TradeWithDetails = Trade & {
  initiator: Profile
  receiver: Profile
  trade_items: Array<TradeItem & { pin: Pick<Pin, 'id' | 'name'> }>
}

export default function TradeDetailScreen() {
  const { tradeId } = useLocalSearchParams<{ tradeId: string }>()
  const { session } = useAuth()
  const router = useRouter()
  const [trade, setTrade] = useState<TradeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    if (!tradeId) return
    supabase
      .from('trades')
      .select(`
        *,
        initiator:profiles!trades_initiator_id_fkey(id, username),
        receiver:profiles!trades_receiver_id_fkey(id, username),
        trade_items(id, side, owner_id, pin:pins(id, name))
      `)
      .eq('id', tradeId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setTrade(data as TradeWithDetails)
        setLoading(false)
      })
  }, [tradeId])

  const updateStatus = async (status: string) => {
    setActing(true)
    const update: Record<string, string> = { status }
    if (status === 'completed') update.completed_at = new Date().toISOString()
    const { error } = await supabase.from('trades').update(update).eq('id', tradeId)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setTrade(prev => prev ? { ...prev, status } : null)
    }
    setActing(false)
  }

  const confirmAction = (label: string, status: string, destructive = false) => {
    Alert.alert(label, `Are you sure?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label,
        style: destructive ? 'destructive' : 'default',
        onPress: () => updateStatus(status),
      },
    ])
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!trade) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Trade not found</Text>
      </View>
    )
  }

  const myId = session!.user.id
  const isInitiator = trade.initiator_id === myId
  const isReceiver = trade.receiver_id === myId
  const counterparty = isInitiator ? trade.receiver : trade.initiator

  const offered = trade.trade_items.filter(t => t.side === 'offered')
  const requested = trade.trade_items.filter(t => t.side === 'requested')

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Trade</Text>
        <Text style={{ color: '#555', fontWeight: '600', textTransform: 'capitalize' }}>
          {trade.status}
        </Text>
      </View>

      <Text style={{ color: '#555', marginBottom: 20 }}>
        {isInitiator ? `Proposed to ${counterparty.username}` : `Proposed by ${counterparty.username}`}
      </Text>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>
          {isInitiator ? 'You offer' : `${trade.initiator.username} offers`}
        </Text>
        {offered.length === 0 ? (
          <Text style={{ color: '#888' }}>Nothing</Text>
        ) : (
          offered.map(item => (
            <View key={item.id} style={{ paddingVertical: 4 }}>
              <Text>• {item.pin.name}</Text>
            </View>
          ))
        )}
      </View>

      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>
          {isInitiator ? 'You want' : `${trade.initiator.username} wants`}
        </Text>
        {requested.length === 0 ? (
          <Text style={{ color: '#888' }}>Nothing</Text>
        ) : (
          requested.map(item => (
            <View key={item.id} style={{ paddingVertical: 4 }}>
              <Text>• {item.pin.name}</Text>
            </View>
          ))
        )}
      </View>

      {trade.completed_at && (
        <Text style={{ color: '#555', marginBottom: 16 }}>
          Completed: {new Date(trade.completed_at).toLocaleDateString()}
        </Text>
      )}

      {/* Actions */}
      <View style={{ gap: 10 }}>
        {isReceiver && trade.status === 'pending' && (
          <>
            <TouchableOpacity
              onPress={() => updateStatus('accepted')}
              disabled={acting}
              style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff' }}>Accept trade</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmAction('Decline', 'cancelled', true)}
              disabled={acting}
              style={{ borderWidth: 1, borderColor: '#dc2626', padding: 14, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#dc2626' }}>Decline</Text>
            </TouchableOpacity>
          </>
        )}

        {trade.status === 'accepted' && (
          <TouchableOpacity
            onPress={() => confirmAction('Mark as completed', 'completed')}
            disabled={acting}
            style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff' }}>Mark as completed</Text>
          </TouchableOpacity>
        )}

        {isInitiator && trade.status === 'pending' && (
          <TouchableOpacity
            onPress={() => confirmAction('Cancel trade', 'cancelled', true)}
            disabled={acting}
            style={{ borderWidth: 1, borderColor: '#dc2626', padding: 14, borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#dc2626' }}>Cancel trade</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}
