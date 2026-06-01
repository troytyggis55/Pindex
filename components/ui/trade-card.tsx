import { View, Text, TouchableOpacity } from 'react-native'
import { ArrowLeftRight, ChevronRight } from 'lucide-react-native'
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
  isLast: boolean
}

export function TradeCard({ trade, currentUserId, isPending = false, onPress, isLast = false }: TradeCardProps) {
  const isInitiator = trade.initiator_id === currentUserId
  const partner = isInitiator ? trade.receiver_profile : trade.initiator
  const partnerName = isInitiator
    ? (trade.receiver_profile?.username ?? trade.receiver_contact?.name ?? '?')
    : trade.initiator.username
  const gave = trade.trade_items.filter(t => isInitiator ? t.side === 'gave' : t.side === 'received')
  const received = trade.trade_items.filter(t => isInitiator ? t.side === 'received' : t.side === 'gave')

  const borderStyle = isLast ? 'border-gray-200' : 'border-gray-200 border-b-transparent'
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={`bg-white overflow-hidden flex-row p-4 items-center border ${borderStyle}`}
    >

      <View className='mr-4'>
        <Avatar url={partner?.avatar_url} username={partnerName} size={60} />
      </View>
        
        {/* Only show status if confirmed is true 
        { trade.status === 'confirmed' && (
          <TradeStatusBadge status={trade.status} />
        )}
        */}

      <View className='flex-col flex-1 gap-1'>
        <Text numberOfLines={1} className="font-monda text-3xl text-ellipsis w-60 text-deep-black">
          {partnerName}
        </Text>

        <View className='flex-row px-1'>
          <View className='flex-1'>
            <PinStack items={gave} mirror />
          </View>
          <View className='absolute inset-0 items-center justify-center'>
            <ArrowLeftRight size={16} color={Colors.dark.muted} strokeWidth={2.5} />
          </View>
          <View className='flex-1 items-end'>
            <PinStack items={received} />
          </View>
        </View>
      </View>

      <ChevronRight size={30} color={Colors.dark.muted} strokeWidth={2} />
    </TouchableOpacity>
  )
}
