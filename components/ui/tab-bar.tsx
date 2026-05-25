import { View, Text, TouchableOpacity } from 'react-native'
import { Colors, Radius } from '@/constants/theme'

export type TabItem<T extends string> = { key: T; label: string }

export type TabBarProps<T extends string> = {
  tabs: TabItem<T>[]
  active: T
  onChange: (key: T) => void
  /**
   * Visual variant:
   * - `'chips'` (default) — bordered pill chips on a transparent background.
   * - `'segmented'` — segmented-control style: chips inside a gray pill container,
   *   white active chip with a subtle shadow.
   */
  variant?: 'chips' | 'segmented'
  /**
   * When true, each chip stretches to fill equal width (`flex: 1`).
   * Useful when chips should fill the row (collection screen).
   * Ignored for `'segmented'` — tabs always fill equal width there.
   */
  equalWidth?: boolean
}

/**
 * Reusable tab chip row.
 *
 * Static layout uses className; only the active-state background/border colours
 * are dynamic (cannot be expressed as plain Tailwind classes without extra config).
 */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'chips',
  equalWidth = false,
}: TabBarProps<T>) {
  if (variant === 'segmented') {
    return (
      <View
        className="flex-row rounded-xl mb-5"
        style={{ backgroundColor: '#f0f0ee', borderRadius: Radius.btn, padding: 3 }}
      >
        {tabs.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => onChange(key)}
            className="flex-1 py-2 items-center"
            style={{
              borderRadius: 11,
              backgroundColor: active === key ? '#fff' : 'transparent',
              shadowColor: active === key ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: active === key ? 2 : 0,
            }}
          >
            <Text
              className="font-monda-bold text-[13px]"
              style={{ color: active === key ? Colors.deepBlack : Colors.dark.muted }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  // chips variant
  return (
    <View className="flex-row gap-2">
      {tabs.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          onPress={() => onChange(key)}
          className={`py-2 items-center border ${equalWidth ? 'flex-1' : 'px-3.5'}`}
          style={{
            borderRadius: Radius.btn,
            backgroundColor: active === key ? Colors.deepBlack : 'transparent',
            borderColor: active === key ? Colors.deepBlack : '#d0d0ce',
          }}
        >
          <Text
            className="font-monda-bold text-[13px]"
            style={{ color: active === key ? '#fff' : Colors.dark.muted }}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
