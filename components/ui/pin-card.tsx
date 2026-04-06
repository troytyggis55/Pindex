import { TouchableOpacity, View, Text, Image } from 'react-native'
import { Colors, Radius, FlagKey } from '@/constants/theme'
import { OrgBadge } from './org-badge'
import { StatusChip } from './status-chip'

interface PinCardProps {
  id: string
  name: string
  index?: number | null          // #001-style display index
  imageUrl?: string | null
  orgName: string
  orgColor?: string | null
  orgLogoUrl?: string | null
  isConfirmed?: boolean          // false = user-created / unverified org
  flags?: {
    in_collection?: boolean
    wishlisted?: boolean
    want_to_trade?: boolean
  }
  onPress?: () => void
}

const CARD_HEIGHT = 160

/**
 * Pokédex-style pin card.
 * - Background: org color (muted if unconfirmed)
 * - Pin image floats top-right, overflowing the card edge
 * - Flag dots stacked bottom-right
 * - Faded index number top-left
 */
export function PinCard({
  name,
  index,
  imageUrl,
  orgName,
  orgColor,
  orgLogoUrl,
  isConfirmed = true,
  flags = {},
  onPress,
}: PinCardProps) {
  const bg = orgColor ?? Colors.orgFallback
  const opacity = isConfirmed ? 1 : 0.22

  const activeFlagKeys = (Object.keys(flags) as FlagKey[]).filter(k => flags[k])

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        height: CARD_HEIGHT,
        borderRadius: Radius.card,
        overflow: 'visible',           // allow image to overflow
        borderWidth: isConfirmed ? 0 : 1.5,
        borderStyle: isConfirmed ? undefined : 'dashed',
        borderColor: isConfirmed ? undefined : 'rgba(255,255,255,0.4)',
      }}
    >
      {/* Colored background */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: bg,
          opacity,
          borderRadius: Radius.card,
        }}
      />

      {/* Decorative concentric rings — bottom-left */}
      <View style={{ position: 'absolute', bottom: -20, left: -20, opacity: 0.12 }}>
        <Ring size={100} color="#fff" />
      </View>

      {/* Index number — top-left */}
      {index != null && (
        <Text
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            fontFamily: 'Monda_700Bold',
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 1,
          }}
        >
          #{String(index).padStart(3, '0')}
        </Text>
      )}

      {/* Unconfirmed label */}
      {!isConfirmed && (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            backgroundColor: 'rgba(0,0,0,0.35)',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: '#fff', fontFamily: 'Monda_400Regular', fontSize: 10 }}>
            Unverified
          </Text>
        </View>
      )}

      {/* Pin image — top-right, overflows upward */}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={{
            position: 'absolute',
            top: -18,
            right: -8,
            width: 100,
            height: 100,
            borderRadius: 50,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
          resizeMode="cover"
        />
      )}

      {/* Bottom row: org badge + name + flag dots */}
      <View
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, marginRight: 8 }}>
          {/* Org badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <OrgBadge name={orgName} logoUrl={orgLogoUrl} color={orgColor} size={18} />
            <Text
              numberOfLines={1}
              style={{ fontFamily: 'Monda_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.8)' }}
            >
              {orgName}
            </Text>
          </View>
          {/* Pin name */}
          <Text
            numberOfLines={2}
            style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: '#fff' }}
          >
            {name}
          </Text>
        </View>

        {/* Flag dots */}
        {activeFlagKeys.length > 0 && (
          <View style={{ gap: 4, alignItems: 'center' }}>
            {activeFlagKeys.map(k => (
              <StatusChip key={k} flag={k} active variant="dot" />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

/** Simple decorative concentric ring element */
function Ring({ size, color }: { size: number; color: string }) {
  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {[1, 0.7, 0.45].map((scale, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: size * scale,
            height: size * scale,
            borderRadius: (size * scale) / 2,
            borderWidth: 1.5,
            borderColor: color,
          }}
        />
      ))}
    </View>
  )
}

// Needed for absoluteFillObject
import { StyleSheet } from 'react-native'
