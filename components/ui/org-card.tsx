import { Text, TouchableOpacity, View } from 'react-native'
import { OrgAvatar } from '@/components/ui/org-avatar'
import { Colors } from '@/constants/theme'
import type { Organization } from '@/types'

interface OrgCardProps {
  org: Organization
  onPress?: () => void
}

/**
 * Full org row card — white card with the org's color as its border,
 * showing the org logo and name. Pressable when onPress is provided.
 * For just the circular logo, use OrgAvatar.
 */
export function OrgCard({ org, onPress }: OrgCardProps) {
  const borderColor = org.color ?? Colors.orgFallback
  const content = (
    <>
      <OrgAvatar name={org.name} logoUrl={org.logo_url} color={org.color} size={40} />
      <Text className="font-monda-bold text-[15px] text-deep-black flex-1">{org.name}</Text>
    </>
  )

  if (!onPress) {
    return (
      <View
        className="flex-row items-center gap-3 bg-white rounded-card p-3.5 border-2"
        style={{ borderColor }}
      >
        {content}
      </View>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-3 bg-white rounded-card p-3.5 border-2"
      style={{ borderColor }}
    >
      {content}
    </TouchableOpacity>
  )
}
