import { View, Text, TouchableOpacity } from 'react-native'
import { X } from 'lucide-react-native'
import { PinCard } from '@/components/ui/pin-card'
import type { TradePinOption } from '@/types'

// Width of the dashed add-pin circle — shared with AddPinButton
export const PIN_CIRCLE = 76
// Fixed slot width for a trade card / add button — keeps every circle on the
// same horizontal grid so the centered item's circle lands dead center.
export const TRADE_CARD_WIDTH = PIN_CIRCLE + 40

export type TradePinCardProps = {
  pin: TradePinOption
  onRemove: () => void
}

export function TradePinCard({ pin, onRemove }: TradePinCardProps) {
  return (
    <View className="items-center" style={{ width: TRADE_CARD_WIDTH }}>
      <PinCard
        id={pin.id}
        name={pin.name}
        orgColor={pin.organization?.color}
        imageUrl={pin.image_url}
        isConfirmed={pin.organization_id != null}
        nameColorWhite={true}
      />
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        className="absolute right-5 w-8 h-8 rounded-full bg-deep-black items-center justify-center"
        style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' }}
      >
        <X size={14} color="#fff" strokeWidth={3} />
      </TouchableOpacity>
    </View>
  )
}
