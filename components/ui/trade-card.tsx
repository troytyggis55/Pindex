import { View, Text, TouchableOpacity } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { Colors, Radius } from '@/constants/theme'
import type { TradeWithDetails } from '@/types'

export type TradeCardProps = {
  trade: TradeWithDetails
  /** The current user's ID — used to determine which side of the trade the viewer is on */
  currentUserId: string
  isPending?: boolean
  onPress: () => void
}

/** Confirmed / Unconfirmed status pill — unexported, only used inside TradeCard */
function StatusBadge({ status }: { status: string }) {
  const isUnconfirmed = status === 'unconfirmed'
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: isUnconfirmed ? '#fef3c7' : '#dcfce7',
      }}
    >
      <Text
        className="font-monda-bold text-[11px]"
        style={{ color: isUnconfirmed ? '#92400e' : '#166534' }}
      >
        {isUnconfirmed ? 'Unconfirmed' : 'Confirmed'}
      </Text>
    </View>
  )
}

export function TradeCard({ trade, currentUserId, isPending = false, onPress }: TradeCardProps) {
  const isInitiator = trade.initiator_id === currentUserId
  const partnerName = isInitiator
    ? (trade.receiver_profile?.username ?? trade.receiver_contact?.name ?? '?')
    : trade.initiator.username
  const gave = trade.trade_items.filter(t => isInitiator ? t.side === 'gave' : t.side === 'received')
  const received = trade.trade_items.filter(t => isInitiator ? t.side === 'received' : t.side === 'gave')

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-card p-3.5"
      style={{
        borderWidth: isPending ? 1.5 : 0,
        borderColor: isPending ? Colors.yellow : 'transparent',
      }}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-monda-bold text-[15px] text-deep-black">{partnerName}</Text>
        <View className="flex-row items-center gap-1.5">
          <StatusBadge status={trade.status} />
          <ChevronRight size={14} color={Colors.dark.muted} strokeWidth={2} />
        </View>
      </View>
      <Text className="font-monda text-[13px] text-gray-500">
        Gave: {gave.map(t => t.pin.name).join(', ') || '—'}
      </Text>
      <Text className="font-monda text-[13px] text-gray-500">
        Received: {received.map(t => t.pin.name).join(', ') || '—'}
      </Text>
    </TouchableOpacity>
  )
}
