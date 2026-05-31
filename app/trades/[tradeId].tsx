import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, ArrowLeftRight } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { Avatar } from '@/components/ui/avatar'
import { TradeStatusBadge } from '@/components/ui/trade-status-badge'
import { TradeSide } from '@/components/ui/trade-side'
import type { TradeDetail } from '@/types'

const HEADER_HEIGHT = 220

export default function TradeDetailScreen() {
  const { tradeId } = useLocalSearchParams<{ tradeId: string }>()
  const { session } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [trade, setTrade] = useState<TradeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  const load = useCallback(async () => {
    if (!tradeId) return
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        initiator:profiles!initiator_id(id, username, avatar_url),
        receiver_profile:profiles!receiver_profile_id(id, username, avatar_url),
        receiver_contact:contacts!receiver_contact_id(id, name),
        trade_items(id, side, pin:pins(id, name, image_url, organization_id, organization:organizations(color)))
      `)
      .eq('id', tradeId)
      .single()
    if (!error && data) setTrade(data as TradeDetail)
    setLoading(false)
  }, [tradeId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const confirmTrade = async () => {
    setConfirming(true)
    const confirmedAt = new Date().toISOString()
    const { error } = await supabase
      .from('trades')
      .update({ status: 'confirmed', confirmed_at: confirmedAt })
      .eq('id', tradeId)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setTrade(prev => prev ? { ...prev, status: 'confirmed', confirmed_at: confirmedAt } : null)
    }
    setConfirming(false)
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-off-white">
        <ActivityIndicator />
      </View>
    )
  }

  if (!trade || !session) {
    return (
      <View className="flex-1 justify-center items-center bg-off-white">
        <Text className="font-monda">Trade not found</Text>
      </View>
    )
  }

  const myId = session.user.id
  const isInitiator = trade.initiator_id === myId
  const isReceiver = trade.receiver_profile_id === myId
  const canConfirm = isReceiver && trade.status === 'unconfirmed'

  // Viewer-centric framing: "you" on the left, the other party on the right.
  const me = isInitiator ? trade.initiator : trade.receiver_profile
  const partnerName = isInitiator
    ? (trade.receiver_profile?.username ?? trade.receiver_contact?.name ?? '?')
    : trade.initiator.username
  const partnerAvatarUrl = isInitiator
    ? trade.receiver_profile?.avatar_url ?? null
    : trade.initiator.avatar_url

  // Items from the viewer's perspective
  const gave = trade.trade_items.filter(t => isInitiator ? t.side === 'gave' : t.side === 'received')
  const received = trade.trade_items.filter(t => isInitiator ? t.side === 'received' : t.side === 'gave')

  const openPin = (pinId: string) => router.push(`/pins/${pinId}`)

  return (
    <View className="flex-1 bg-off-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: canConfirm ? 120 : 40 }}>
        {/* Header band — the two parties facing each other */}
        <View style={{ height: HEADER_HEIGHT }} className="bg-deep-black">
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-4 flex-row items-center gap-1 bg-white/15 px-3 py-1.5 rounded-btn"
            style={{ top: insets.top + 12 }}
          >
            <ChevronLeft size={16} color="#fff" strokeWidth={2.5} />
            <Text className="font-monda-bold text-[13px] text-white">Back</Text>
          </TouchableOpacity>

          <View className="absolute right-4" style={{ top: insets.top + 12 }}>
            <TradeStatusBadge status={trade.status} />
          </View>

          <View className="flex-1 flex-row items-center justify-center gap-6" style={{ paddingTop: insets.top + 24 }}>
            <View className="items-center gap-2 w-20">
              <Avatar url={me?.avatar_url} username={me?.username ?? 'You'} size={64} />
              <Text numberOfLines={1} className="font-monda-bold text-[13px] text-white">You</Text>
            </View>

            <ArrowLeftRight size={22} color="rgba(255,255,255,0.6)" strokeWidth={2} />

            <View className="items-center gap-2 w-20">
              <Avatar url={partnerAvatarUrl} username={partnerName} size={64} />
              <Text numberOfLines={1} className="font-monda-bold text-[13px] text-white">{partnerName}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="px-4 pt-6 gap-7">
          {trade.confirmed_at && (
            <Text className="font-monda text-[13px] text-gray-500 text-center">
              Confirmed {new Date(trade.confirmed_at).toLocaleDateString()}
            </Text>
          )}

          <TradeSide label="You gave" items={gave} onPinPress={openPin} />

          <View className="h-px bg-[#e8e8e6]" />

          <TradeSide label="You received" items={received} onPinPress={openPin} />
        </View>
      </ScrollView>

      {/* Confirm action bar — fixed at bottom */}
      {canConfirm && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-off-white border-t border-t-[#e8e8e6] px-4 pt-3"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <TouchableOpacity
            onPress={() => Alert.alert('Confirm trade', 'Confirm that this trade happened?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Confirm', onPress: confirmTrade },
            ])}
            disabled={confirming}
            className="bg-deep-black py-[14px] rounded-btn items-center"
          >
            {confirming
              ? <ActivityIndicator color="#fff" />
              : <Text className="font-monda-bold text-sm text-white">Confirm trade</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
