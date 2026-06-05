import { View } from 'react-native'
import { PinCard } from '@/components/ui/pin-card'
import type { PinWithOrg } from '@/types'

export interface PinGridProps {
  pins: PinWithOrg[]
  onPressPin: (id: string) => void
}

/** A 3-column, left-aligned grid of PinCards. */
export function PinGrid({ pins, onPressPin }: PinGridProps) {
  return (
    <View className="flex-row flex-wrap gap-3 px-4">
      {pins.map(pin => (
        <View key={pin.id} className="w-[31%]">
          <PinCard
            id={pin.id}
            name={pin.name}
            imageUrl={pin.image_url}
            orgColor={pin.organization?.color}
            orgLogoUrl={pin.organization?.logo_url}
            isConfirmed={pin.org_claimed_at != null}
            onPress={() => onPressPin(pin.id)}
          />
        </View>
      ))}
    </View>
  )
}
