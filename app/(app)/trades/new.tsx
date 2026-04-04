import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { UserPin, Pin } from '@/types'

type PinItem = UserPin & { pin: Pin }

export default function NewTradeScreen() {
  const { receiverId } = useLocalSearchParams<{ receiverId: string }>()
  const { session } = useAuth()
  const router = useRouter()

  const [receiverUsername, setReceiverUsername] = useState('')
  const [myTradingPins, setMyTradingPins] = useState<PinItem[]>([])
  const [theirTradingPins, setTheirTradingPins] = useState<PinItem[]>([])
  const [offeredIds, setOfferedIds] = useState<Set<string>>(new Set())
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!receiverId || !session?.user) return
    const fetchData = async () => {
      const [profileRes, myPinsRes, theirPinsRes] = await Promise.all([
        supabase.from('profiles').select('username').eq('id', receiverId).single(),
        supabase
          .from('user_pins')
          .select('*, pin:pins(*)')
          .eq('user_id', session.user.id)
          .eq('status', 'trading'),
        supabase
          .from('user_pins')
          .select('*, pin:pins(*)')
          .eq('user_id', receiverId)
          .eq('status', 'trading'),
      ])
      if (profileRes.data) setReceiverUsername(profileRes.data.username)
      if (myPinsRes.data) setMyTradingPins(myPinsRes.data as PinItem[])
      if (theirPinsRes.data) setTheirTradingPins(theirPinsRes.data as PinItem[])
      setLoading(false)
    }
    fetchData()
  }, [receiverId])

  const toggle = (id: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setter(next)
  }

  const submitTrade = async () => {
    if (!session?.user || !receiverId) return
    if (offeredIds.size === 0 && requestedIds.size === 0) {
      Alert.alert('Empty trade', 'Select at least one pin to offer or request.')
      return
    }
    setSubmitting(true)

    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({ initiator_id: session.user.id, receiver_id: receiverId, status: 'pending' })
      .select('id')
      .single()

    if (tradeError || !trade) {
      Alert.alert('Error', tradeError?.message ?? 'Could not create trade')
      setSubmitting(false)
      return
    }

    const items = [
      ...[...offeredIds].map(pin_id => ({
        trade_id: trade.id,
        pin_id,
        owner_id: session.user.id,
        side: 'offered',
      })),
      ...[...requestedIds].map(pin_id => ({
        trade_id: trade.id,
        pin_id,
        owner_id: receiverId,
        side: 'requested',
      })),
    ]

    const { error: itemsError } = await supabase.from('trade_items').insert(items)
    if (itemsError) {
      Alert.alert('Error', itemsError.message)
      // Roll back the trade
      await supabase.from('trades').delete().eq('id', trade.id)
      setSubmitting(false)
      return
    }

    router.replace(`/(app)/trades/${trade.id}`)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  const PinSelector = ({
    label,
    items,
    selected,
    onToggle,
  }: {
    label: string
    items: PinItem[]
    selected: Set<string>
    onToggle: (id: string) => void
  }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>{label}</Text>
      {items.length === 0 ? (
        <Text style={{ color: '#888' }}>No pins available for trading</Text>
      ) : (
        items.map(item => {
          const isSelected = selected.has(item.pin_id)
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onToggle(item.pin_id)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isSelected ? '#000' : '#e0e0e0',
                backgroundColor: isSelected ? '#f0f0f0' : '#fff',
                marginBottom: 8,
              }}
            >
              <Text style={{ fontWeight: isSelected ? '600' : '400' }}>{item.pin.name}</Text>
              {isSelected && <Text>✓</Text>}
            </TouchableOpacity>
          )
        })
      )}
    </View>
  )

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>Propose a trade</Text>
      <Text style={{ color: '#555', marginBottom: 24 }}>with {receiverUsername}</Text>

      <PinSelector
        label="Your pins to offer"
        items={myTradingPins}
        selected={offeredIds}
        onToggle={id => toggle(id, offeredIds, setOfferedIds)}
      />

      <PinSelector
        label={`${receiverUsername}'s pins you want`}
        items={theirTradingPins}
        selected={requestedIds}
        onToggle={id => toggle(id, requestedIds, setRequestedIds)}
      />

      <TouchableOpacity
        onPress={submitTrade}
        disabled={submitting}
        style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff' }}>{submitting ? 'Sending...' : 'Send trade request'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
