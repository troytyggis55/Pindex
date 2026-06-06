import { View, Text, TouchableOpacity } from 'react-native'
import { Plus } from 'lucide-react-native'
import { PIN_CIRCLE, TRADE_CARD_WIDTH } from '@/components/ui/trade-pin-card'

export type AddPinButtonProps = {
  onPress: () => void
}

export function AddPinButton({ onPress }: AddPinButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} className="items-center" style={{ width: TRADE_CARD_WIDTH }}>
      <View
        className="items-center justify-center"
        style={{
          width: PIN_CIRCLE,
          height: PIN_CIRCLE,
          borderRadius: PIN_CIRCLE / 2,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: 'rgba(255,255,255,0.25)',
        }}
      >
        <Plus size={22} color="white" strokeWidth={2} />
      </View>
    </TouchableOpacity>
  )
}
