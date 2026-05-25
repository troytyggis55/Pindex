import { View, Text, TouchableOpacity } from 'react-native'
import { ChevronLeft } from 'lucide-react-native'
import { Colors } from '@/constants/theme'

export type ScreenHeaderProps = {
  /** When provided: renders a full header row with chevron + title + optional right slot.
   *  When omitted: renders a compact "Back" link row. */
  title?: string
  /** Called when the back chevron is pressed. Omit to hide the back button. */
  onBack?: () => void
  /** Optional content anchored to the trailing edge (title mode only). */
  right?: React.ReactNode
  /** Extra className applied to the outermost container. */
  className?: string
}

/**
 * ScreenHeader — back button with optional title and right slot.
 *
 * Back-only mode (no `title`):
 *   [chevron] Back
 *
 * Title mode (with `title`):
 *   [chevron]  Title text  [right?]
 */
export function ScreenHeader({ title, onBack, right, className }: ScreenHeaderProps) {
  if (title) {
    return (
      <View className={`flex-row items-center gap-3 pb-3${className ? ` ${className}` : ''}`}>
        {onBack && (
          <TouchableOpacity onPress={onBack} hitSlop={8}>
            <ChevronLeft size={24} color={Colors.deepBlack} strokeWidth={2} />
          </TouchableOpacity>
        )}
        <Text className="font-monda-bold text-[22px] text-deep-black flex-1">{title}</Text>
        {right}
      </View>
    )
  }

  // Back-only mode
  return (
    <TouchableOpacity
      onPress={onBack}
      className={`flex-row items-center gap-1 mb-5${className ? ` ${className}` : ''}`}
      hitSlop={8}
    >
      <ChevronLeft size={20} color={Colors.deepBlack} strokeWidth={2} />
      <Text className="font-monda-bold text-sm text-deep-black">Back</Text>
    </TouchableOpacity>
  )
}
