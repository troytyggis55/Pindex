import { View, Text } from 'react-native'
import { PinCard } from '@/components/ui/pin-card'
import type { TradeDetailItem } from '@/types'

export type TradeSideProps = {
  /** Section heading, e.g. "You gave" */
  label: string
  items: TradeDetailItem[]
  onPinPress: (pinId: string) => void
}

/** One side of a trade — a heading with a count and a wrapped grid of pin cards. */
export function TradeSide({ label, items, onPinPress }: TradeSideProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-1.5">
        <Text className="font-monda-bold text-[13px] text-gray-500">{label}</Text>
        <Text className="font-monda text-[13px] text-gray-400">{items.length}</Text>
      </View>

      {items.length === 0 ? (
        <Text className="font-monda text-sm text-gray-400">Nothing</Text>
      ) : (
        <View className="flex-row flex-wrap gap-x-3 gap-y-4">
          {items.map(item => (
            <PinCard
              key={item.id}
              id={item.pin.id}
              name={item.pin.name}
              imageUrl={item.pin.image_url}
              orgColor={item.pin.organization?.color}
              isConfirmed={item.pin.organization_id != null}
              onPress={() => onPinPress(item.pin.id)}
            />
          ))}
        </View>
      )}
    </View>
  )
}
