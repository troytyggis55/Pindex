import { View, Text } from 'react-native'
import { PinCard } from '@/components/ui/pin-card'
import type { TradePinSnap } from '@/types'

export type PinStackProps = {
  pins: TradePinSnap[]
  mirror?: boolean
  /** PinCard circle size — defaults to the compact 'small' used in trade cards. */
  size?: 'small' | 'medium' | 'large'
  /** Render a "—" placeholder when there are no pins. Defaults to true. */
  showEmptyPlaceholder?: boolean
  /**
   * When provided, each card becomes tappable and calls this with its pin id.
   * Omit to keep the stack non-interactive (taps fall through to the parent).
   */
  onPinPress?: (pinId: string) => void
}

/** How far each card slides under the previous one. */
const OVERLAPS: Record<NonNullable<PinStackProps['size']>, number> = {
  small: 10,
  medium: 30,
  large: 30,
}
/** Show at most this many cards before collapsing the rest into a +N badge. */
const MAX_VISIBLE = 3

/**
 * A horizontal row of overlapping PinCards. Beyond MAX_VISIBLE cards the
 * remainder collapse into a "+N" badge. The row sizes to its content, so a
 * parent with `items-center` keeps the stack centered regardless of count.
 * Cards are non-interactive so taps fall through to the enclosing trade card.
 */
export function PinStack({ pins, mirror = false, size = 'small', showEmptyPlaceholder = true, onPinPress }: PinStackProps) {
  if (pins.length === 0) {
    return showEmptyPlaceholder
      ? <Text className="font-monda text-[13px] text-gray-400">—</Text>
      : null
  }

  const visible = pins.slice(0, MAX_VISIBLE)
  const overflow = pins.length - visible.length
  const displayPins = mirror ? [...visible].reverse() : visible
  const overlap = OVERLAPS[size]

  return (
    <View className="flex-row items-center">
      {mirror && overflow > 0 && (
        <View
          pointerEvents="none"
          style={{ zIndex: 0 }}
          className="rounded-full bg-gray-200 items-center justify-center"
        >
          <Text className={`font-monda-bold text-gray-500 ${size === 'small' ? 'text-[15px] px-1' : 'text-xl px-2'}`}>
            +{overflow}
          </Text>
        </View>
      )}

      {displayPins.map((pin, i) => {
        const marginLeft = i === 0 && !(mirror && overflow > 0) ? 0 : -overlap
        const zIndex = mirror ? i + 1 : visible.length - i
        return (
          <View key={pin.id} pointerEvents={onPinPress ? 'auto' : 'none'} style={{ marginLeft, zIndex }}>
            <PinCard
              id={pin.id}
              name={pin.name}
              imageUrl={pin.image_url}
              orgColor={pin.organization?.color}
              isConfirmed={pin.organization_id != null}
              size={size}
              hideName
              hideBorder
              onPress={onPinPress ? () => onPinPress(pin.id) : undefined}
            />
          </View>
        )
      })}

      {!mirror && overflow > 0 && (
        <Text className={`font-monda-bold text-gray-500 ${size === 'small' ? 'text-[15px] px-1' : 'text-xl px-2'}`}>
          +{overflow}
        </Text>
      )}
    </View>
  )
}
