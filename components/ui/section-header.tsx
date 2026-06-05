import { View, Text } from 'react-native'

export interface SectionHeaderProps {
  label: string
  count: number
}

/** A section title with a filled count badge, e.g. "Unclaimed  (3)". */
export function SectionHeader({ label, count }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center gap-2 px-4 pt-5 pb-3">
      <Text className="font-monda-bold text-[15px] text-deep-black">{label}</Text>
      <View className="bg-deep-black px-2 py-0.5 rounded-[10px]">
        <Text className="font-monda-bold text-[11px] text-off-white">{count}</Text>
      </View>
    </View>
  )
}
