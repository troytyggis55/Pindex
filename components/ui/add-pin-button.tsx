import { View, Text, TouchableOpacity } from 'react-native'
import { Plus } from 'lucide-react-native'
import { PIN_CIRCLE } from '@/components/ui/trade-pin-card'

export type AddPinButtonProps = {
  onPress: () => void
}

export function AddPinButton({ onPress }: AddPinButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} className="items-center">
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
        <Plus size={22} color="rgba(255,255,255,0.4)" strokeWidth={2} />
      </View>
      <Text
        className="mt-1.5 font-monda text-[11px]"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        Add pin
      </Text>
    </TouchableOpacity>
  )
}
