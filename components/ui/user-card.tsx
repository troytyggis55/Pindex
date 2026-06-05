import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { Colors } from '@/constants/theme'
import { Avatar } from '@/components/ui/avatar'

export interface UserRowProps {
  id: string
  username: string
  avatarUrl?: string | null
  /** Called when the row (or avatar/name area) is tapped */
  onPress?: () => void
  /** Show a Follow / Following toggle button on the right */
  isFollowing?: boolean
  /** Show a spinner inside the follow button while the action is in flight */
  followLoading?: boolean
  onFollowToggle?: () => void
  /** Show a right-pointing chevron instead of (or alongside) a follow button */
  showChevron?: boolean
  /** Optional secondary line under the username (e.g. "Not on Pindex") */
  subtitle?: string
  /**
   * Prefix the username with `@`. Turn off for non-Pindex names (contacts).
   * @default true
   */
  atPrefix?: boolean
  /**
   * Wraps the row in a white rounded card.
   * Pass `false` for inline lists that use a separator line instead (e.g. inside a modal).
   * @default true
   */
  card?: boolean
}

export function UserCard({
  username,
  avatarUrl,
  onPress,
  isFollowing,
  followLoading = false,
  onFollowToggle,
  showChevron = false,
  subtitle,
  atPrefix = true,
  card = true,
}: UserRowProps) {
  const showFollowBtn = onFollowToggle !== undefined

  const inner = (
    <View
      className={`flex-row items-center gap-3 ${card ? 'bg-white rounded-card p-3.5 shadow-md' : 'py-3 border-b border-gray-100'}`}

    >
      {/* Avatar */}
      <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
        <Avatar url={avatarUrl} username={username} size={40} />
      </TouchableOpacity>

      {/* Username */}
      <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1} className="flex-1">
        <Text className="font-monda-bold text-[15px] text-deep-black">
          {atPrefix ? '@' : ''}{username}
        </Text>
        {subtitle && (
          <Text className="font-monda text-xs text-gray-400 mt-0.5">
            {subtitle}
          </Text>
        )}
      </TouchableOpacity>

      {/* Right slot: follow button, chevron, or nothing */}
      {showFollowBtn && (
        <TouchableOpacity
          onPress={onFollowToggle}
          disabled={followLoading}
          className={`px-3.5 py-1.5 rounded-btn border ${
            isFollowing ? 'bg-transparent border-gray-200' : 'bg-deep-black border-deep-black'
          }`}
        >
          {followLoading ? (
            <ActivityIndicator
              size="small"
              color={isFollowing ? Colors.dark.muted : '#fff'}
            />
          ) : (
            <Text className={`font-monda-bold text-xs ${isFollowing ? 'text-gray-500' : 'text-white'}`}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {showChevron && !showFollowBtn && (
        <ChevronRight size={16} color={Colors.dark.muted} strokeWidth={2} />
      )}
    </View>
  )

  return inner
}
