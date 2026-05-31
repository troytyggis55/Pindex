import { View, Text, TouchableOpacity } from 'react-native'
import { ArrowLeftRight } from 'lucide-react-native'
import { TradeStatusBadge } from '@/components/ui/trade-status-badge'
import { PinStack } from '@/components/ui/pin-stack'
import { Avatar } from '@/components/ui/avatar'
import { Colors } from '@/constants/theme'
import type { TradeWithDetails } from '@/types'

export type TradeCardProps = {
  trade: TradeWithDetails
  /** The current user's ID — used to determine which side of the trade the viewer is on */
  currentUserId: string
  isPending?: boolean
  onPress: () => void
}

export function TradeCard({ trade, currentUserId, isPending = false, onPress }: TradeCardProps) {
  const isInitiator = trade.initiator_id === currentUserId
  const partner = isInitiator ? trade.receiver_profile : trade.initiator
  const partnerName = isInitiator
    ? (trade.receiver_profile?.username ?? trade.receiver_contact?.name ?? '?')
    : trade.initiator.username
  const gave = trade.trade_items.filter(t => isInitiator ? t.side === 'gave' : t.side === 'received')
  const received = trade.trade_items.filter(t => isInitiator ? t.side === 'received' : t.side === 'gave')

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="bg-white rounded-card overflow-hidden"
      style={{
        borderWidth: isPending ? 1.5 : 1,
        borderColor: isPending ? Colors.yellow : '#EFEEE8',
        boxShadow: '0px 6px 18px rgba(0,14,25,0.06)',
      }}
    >
      {/* Header — partner identity + status */}
      <View className="flex-row items-center justify-between px-4 pt-3.5 pb-3">
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          <Avatar url={partner?.avatar_url} username={partnerName} size={36} />
          <View className="flex-1">
            <Text className="font-monda text-[10px] text-gray-400" style={{ letterSpacing: 0.5 }}>
              TRADE WITH
            </Text>
            <Text numberOfLines={1} className="font-monda-bold text-[15px] text-deep-black">
              {partnerName}
            </Text>
          </View>
        </View>

        {/* Only show status if confirmed is true */}
        { trade.status === 'confirmed' && (
          <TradeStatusBadge status={trade.status} />
        )}

        <View className="flex-row items-end gap-2.5 flex-1 mr-2">
          <View className="flex-1">
            <Text numberOfLines={1} className="font-monda-bold text-[15px] text-deep-black">
              {partnerName}
            </Text>
          </View>
          <Avatar url={partner?.avatar_url} username={partnerName} size={36} />
        </View>
      </View>

      {/* Hairline divider */}
      <View className="h-px bg-gray-100" />

      {/* Exchange — what you gave ⇄ what you got */}
      <View className="flex-row items-center px-4 py-4">
        <View className="flex-1 items-center gap-2.5">
          <PinStack items={gave} mirror />
        </View>

        <View className="w-9 h-9 rounded-full bg-off-white items-center justify-center mx-1">
          <ArrowLeftRight size={16} color={Colors.dark.muted} strokeWidth={2.5} />
        </View>

        <View className="flex-1 items-center gap-2.5">
          <PinStack items={received} />
        </View>
      </View>
    </TouchableOpacity>
  )
}
