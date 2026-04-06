import { TouchableOpacity, Text, View } from 'react-native'
import { FLAGS, FlagKey } from '@/constants/theme'

interface StatusChipProps {
  flag: FlagKey
  active: boolean
  onPress?: () => void
  /** 'pill' = filled/outlined pill button (pin detail action bar)
   *  'dot'  = small indicator dot (pin card overlay) */
  variant?: 'pill' | 'dot'
}

/**
 * Represents one UserPin flag (in_collection / wishlisted / want_to_trade).
 * Pill variant: tappable action button (active = filled, inactive = outlined).
 * Dot variant: small non-interactive status indicator shown on cards.
 */
export function StatusChip({ flag, active, onPress, variant = 'pill' }: StatusChipProps) {
  const meta = FLAGS.find(f => f.key === flag)!

  if (variant === 'dot') {
    if (!active) return null
    return (
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: meta.color,
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.6)',
        }}
      />
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: meta.color,
        backgroundColor: active ? meta.color : 'transparent',
      }}
    >
      <Text
        style={{
          fontFamily: 'Monda_700Bold',
          fontSize: 13,
          color: active ? '#fff' : meta.color,
        }}
      >
        {meta.label}
      </Text>
    </TouchableOpacity>
  )
}

/** Row of all three flag chips — convenience wrapper for the pin detail action bar */
interface StatusChipRowProps {
  in_collection: boolean
  wishlisted: boolean
  want_to_trade: boolean
  onToggle: (flag: FlagKey) => void
}

export function StatusChipRow({ in_collection, wishlisted, want_to_trade, onToggle }: StatusChipRowProps) {
  const values: Record<FlagKey, boolean> = { in_collection, wishlisted, want_to_trade }
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {FLAGS.map(f => (
        <StatusChip
          key={f.key}
          flag={f.key}
          active={values[f.key]}
          onPress={() => onToggle(f.key)}
          variant="pill"
        />
      ))}
    </View>
  )
}
