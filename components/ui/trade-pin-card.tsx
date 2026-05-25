import { View, Text, TouchableOpacity } from 'react-native'
import { X } from 'lucide-react-native'
import { PinCard } from '@/components/ui/pin-card'
import type { TradePinOption } from '@/types'

// Width of the dashed add-pin circle — shared with AddPinButton
export const PIN_CIRCLE = 76

export type TradePinCardProps = {
  pin: TradePinOption
  onRemove: () => void
}

export function TradePinCard({ pin, onRemove }: TradePinCardProps) {
  return (
    <View className="items-center">
      <View>
        <PinCard
          id={pin.id}
          orgName={pin.organization?.name ?? 'Independent'}
          orgColor={pin.organization?.color}
          imageUrl={pin.image_url}
          isConfirmed={pin.organization_id != null}
        />
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-deep-black items-center justify-center"
          style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' }}
        >
          <X size={10} color="#fff" strokeWidth={3} />
        </TouchableOpacity>
      </View>
      <Text
        numberOfLines={1}
        className="mt-1.5 font-monda-bold text-[11px] text-center"
        style={{ color: 'rgba(255,255,255,0.85)', width: PIN_CIRCLE + 16 }}
      >
        {pin.name}
      </Text>
    </View>
  )
}
