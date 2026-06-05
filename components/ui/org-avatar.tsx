import { View, Text, Image } from 'react-native'
import { Colors } from '@/constants/theme'

interface OrgAvatarProps {
  name: string
  logoUrl?: string | null
  color?: string | null
  size?: number
}

/**
 * Small circular org badge — shows logo if available, else org initial.
 * The circle background uses the org's color (fallback to Colors.orgFallback).
 * For a full pressable org row, use OrgCard instead.
 */
export function OrgAvatar({ name, logoUrl, color, size = 28 }: OrgAvatarProps) {
  const bg = color ?? Colors.orgFallback

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text
          style={{
            color: '#fff',
            fontSize: size * 0.4,
            fontFamily: 'Monda_700Bold',
            lineHeight: size * 0.5,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  )
}
