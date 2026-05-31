import { View, Text } from 'react-native'
import { PinCard } from '@/components/ui/pin-card'
import type { TradeDetailItem } from '@/types'

export type PinStackProps = {
  items: TradeDetailItem[]
  mirror?: boolean
}

/** Circle diameter for cards in the stack. */
const PIN_SIZE = 52
/** How far each card slides under the previous one. */
const OVERLAP = 18
/** Show at most this many cards before collapsing the rest into a +N badge. */
const MAX_VISIBLE = 3

/**
 * A horizontal row of overlapping PinCards. Beyond MAX_VISIBLE cards the
 * remainder collapse into a "+N" badge. The row sizes to its content, so a
 * parent with `items-center` keeps the stack centered regardless of count.
 * Cards are non-interactive so taps fall through to the enclosing trade card.
 */
export function PinStack({ items, mirror = false }: PinStackProps) {
  if (items.length === 0) {
    return <Text className="font-monda text-[13px] text-gray-400">—</Text>
  }

  const visible = items.slice(0, MAX_VISIBLE)
  const overflow = items.length - visible.length
  const displayItems = mirror ? [...visible].reverse() : visible

  return (
    <View className="flex-row items-center">
      {mirror && overflow > 0 && (
        <View
          pointerEvents="none"
          style={{ width: PIN_SIZE, height: PIN_SIZE, zIndex: 0 }}
          className="rounded-full bg-gray-200 items-center justify-center"
        >
          <Text className="font-monda-bold text-[15px] text-gray-600">+{overflow}</Text>
        </View>
      )}

      {displayItems.map((item, i) => {
        const marginLeft = i === 0 && !(mirror && overflow > 0) ? 0 : -OVERLAP
        const zIndex = mirror ? i + 1 : visible.length - i
        return (
          <View key={item.id} pointerEvents="none" style={{ marginLeft, zIndex }}>
            <PinCard
              id={item.pin.id}
              name={item.pin.name}
              imageUrl={item.pin.image_url}
              orgColor={item.pin.organization?.color}
              isConfirmed={item.pin.organization_id != null}
              size={PIN_SIZE}
              hideName
              hideShadow
            />
          </View>
        )
      })}

      {!mirror && overflow > 0 && (
        <View
          pointerEvents="none"
          style={{ width: PIN_SIZE, height: PIN_SIZE, marginLeft: -OVERLAP, zIndex: 0 }}
          className="rounded-full bg-gray-200 items-center justify-center"
        >
          <Text className="font-monda-bold text-[15px] text-gray-600">+{overflow}</Text>
        </View>
      )}
    </View>
  )
}
