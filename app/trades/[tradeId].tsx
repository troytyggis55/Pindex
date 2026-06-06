import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, ChevronRight, ArrowLeftRight, Check, ArrowUpDown } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { UserCard } from '@/components/ui/user-card'
import { PinStack } from '@/components/ui/pin-stack'
import { TradeStatusBadge } from '@/components/ui/trade-status-badge'
import { Colors } from '@/constants/theme'
import type { TradeDetail, TradeDetailItem } from '@/types'

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

  const promptConfirm = () => Alert.alert('Confirm trade', 'Confirm that this trade happened?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', onPress: confirmTrade },
  ])

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

  // Viewer-centric framing: "you" at the bottom, the other party at the top.
  const me = isInitiator ? trade.initiator : trade.receiver_profile
  const partnerProfile = isInitiator ? trade.receiver_profile : trade.initiator
  const partnerContact = isInitiator ? trade.receiver_contact : null
  const partnerName = partnerProfile?.username ?? partnerContact?.name ?? '?'
  const partnerIsContact = !partnerProfile && !!partnerContact

  // Items from the viewer's perspective
  const gave = trade.trade_items.filter(t => isInitiator ? t.side === 'gave' : t.side === 'received')
  const received = trade.trade_items.filter(t => isInitiator ? t.side === 'received' : t.side === 'gave')

  const openPin = (pinId: string) => router.push(`/pins/${pinId}`)

  const myName = me?.username ?? 'You'

  // Tappable text row mirroring new.tsx's pin lists, but read-only and navigating.
  const renderPinRow = (item: TradeDetailItem) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => openPin(item.pin.id)}
      className="flex-row items-center justify-between py-2.5 border-b border-gray-100"
    >
      <Text numberOfLines={1} className="flex-1 font-monda text-[14px] text-deep-black">
        {item.pin.name}
      </Text>
      <ChevronRight size={15} color={Colors.dark.muted} strokeWidth={2} />
    </TouchableOpacity>
  )

  return (
    <View className="flex-1 bg-off-white">

      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute left-4 z-[30] w-9 h-9 rounded-full bg-black/[0.06] items-center justify-center"
        style={{ top: insets.top + 14 }}
      >
        <ChevronLeft size={18} color={Colors.deepBlack} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Status badge */}
      <View className="absolute right-4 z-[30]" style={{ top: insets.top + 16 }}>
        <TradeStatusBadge status={trade.status} />
      </View>

      {/* ── TOP HALF — trading partner ── */}
      <View className="flex-1 px-4 pb-8" style={{ paddingTop: insets.top + 64 }}>
        {trade.confirmed_at && (
          <Text className="font-monda text-[11px] text-gray-400 text-center mb-3">
            Confirmed {new Date(trade.confirmed_at).toLocaleDateString()}
          </Text>
        )}

        {/* Partner card */}
        <UserCard
          id={partnerProfile?.id ?? partnerName}
          username={partnerName}
          avatarUrl={partnerProfile?.avatar_url}
          atPrefix={!partnerIsContact}
          subtitle={partnerIsContact ? 'Not on Pindex' : undefined}
          onPress={partnerProfile ? () => router.push(`/users/${partnerProfile.id}`) : undefined}
          showChevron={!!partnerProfile}
        />

        <View className="flex-1">
          <Text className="font-monda-bold text-[10px] text-gray-400 tracking-[1.4px] mb-[14px] mt-2 text-center">
            THEY GAVE
          </Text>

          <View className="items-center justify-center">
            <PinStack pins={received.map(i => i.pin)} size="medium" showEmptyPlaceholder={false} onPinPress={openPin} />
          </View>

          <ScrollView className="flex-1 mt-3" showsVerticalScrollIndicator={true}>
            {received.length === 0 ? (
              <Text className="font-monda text-[13px] text-gray-400 text-center mt-2">Nothing</Text>
            ) : (
              received.map(renderPinRow)
            )}
          </ScrollView>
        </View>
      </View>

      {/* ── POKEBALL DIVIDER ── */}
      <View className="h-16 items-center justify-center z-10">
        <View className="absolute left-0 right-0 h-1 bg-gray-200" />
        {canConfirm ? (
          <TouchableOpacity
            onPress={promptConfirm}
            disabled={confirming}
            activeOpacity={0.85}
            className="w-16 h-16 rounded-full bg-pin-red items-center justify-center border-[3px] border-white"
            style={{
              shadowColor: '#CD0808',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            {confirming
              ? <ActivityIndicator color="#fff" size="small" />
              : <Check size={24} color="#fff" strokeWidth={2.5} />
            }
          </TouchableOpacity>
        ) : (
          <View className="w-16 h-16 rounded-full bg-white items-center justify-center border-[3px] border-gray-100 ">
            {trade.status === 'confirmed'
              ? <Check size={22} color={Colors.deepBlack} strokeWidth={2.5} />
              : <ArrowUpDown size={22} color={Colors.dark.muted} strokeWidth={2} />
            }
          </View>
        )}
      </View>

      {/* ── BOTTOM HALF — current user ── */}
      <View className="flex-1 pt-8 px-4" style={{ paddingBottom: insets.bottom + 24 }}>
        <View className="flex-1">
          <View className="items-center justify-center">
            <PinStack pins={gave.map(i => i.pin)} size="medium" showEmptyPlaceholder={false} onPinPress={openPin} />
          </View>

          <ScrollView className="flex-1 mt-3" showsVerticalScrollIndicator={true}>
            {gave.length === 0 ? (
              <Text className="font-monda text-[13px] text-gray-400 text-center mt-2">Nothing</Text>
            ) : (
              gave.map(renderPinRow)
            )}
          </ScrollView>
        </View>

        <Text className="font-monda-bold text-[10px] text-gray-400 tracking-[1.4px] mb-2 text-center">
          YOU GAVE
        </Text>

        <UserCard
          id={me?.id ?? 'you'}
          username={myName}
          avatarUrl={me?.avatar_url}
        />
      </View>
    </View>
  )
}
