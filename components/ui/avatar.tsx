import { View, Text, Image } from 'react-native'

export type AvatarProps = {
  url?: string | null
  username: string
  /** Diameter in pixels. Default: 40 */
  size?: number
}

/**
 * Circular user avatar.
 * Shows the profile image when `url` is provided; falls back to the first
 * letter of `username` on a dark background.
 *
 * Static layout styles use className; dynamic size/radius use style.
 */
export function Avatar({ url, username, size = 40 }: AvatarProps) {
  const radius = size / 2
  const fontSize = Math.round(size * 0.4)

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    )
  }

  return (
    <View
      className="bg-deep-black items-center justify-center"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <Text className="font-monda-bold text-white" style={{ fontSize }}>
        {username.charAt(0).toUpperCase()}
      </Text>
    </View>
  )
}
