import { Ref } from 'react'
import { Pressable, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui'
import { useRouter } from 'expo-router'
import { ArrowUpDown, Compass, Home, type LucideIcon } from 'lucide-react-native'
import { Colors } from '@/constants/theme'

const TRADE_BUTTON_SIZE = 72

type NavTabButtonProps = TabTriggerSlotProps & {
  icon: LucideIcon
  isLeftSide: boolean
  ref?: Ref<View>
}

/**
 * A single icon tab. `isFocused` and the press handlers are forwarded from the
 * wrapping `<TabTrigger asChild>`. When focused the whole cell fills with a
 * brighter surface; the bar's `overflow-hidden` + `rounded-t-4xl` clips the
 * outer-top corner, while the inner edge stays flat where the two tabs meet.
 */
function NavTabButton({ icon: Icon, isFocused, isLeftSide, ...props }: NavTabButtonProps) {
  return (
    <Pressable {...props} className="flex-1 self-stretch">
      <View
        className={`flex-1 items-center justify-center ${isFocused ? `bg-deep-black-surface  border-deep-black border-t-4 border-b-4 ${isLeftSide ? ' rounded-l-4xl' : 'rounded-r-4xl'}` : ''} ${isLeftSide ? 'pr-8 border-l-4' : 'pl-8 border-r-4'}`}
      >
        <Icon size={32} color={isFocused ? Colors.offWhite : Colors.dark.muted} strokeWidth={2} />
      </View>
    </Pressable>
  )
}

export default function AppLayout() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  return (
    <Tabs>
      <View className="flex-1 bg-pin-red" style={{ paddingTop: insets.top }}>
        <TabSlot />
      </View>

      {/* The visible bar — only the two tabs, meeting flush at the centre. The
          trade button floats over the seam as a sibling below, so it isn't
          clipped by `overflow-hidden`. TabTriggers only need a `name`; the
          hidden TabList below does the route registration. */}
      <View
        className="absolute left-0 right-0 items-center z-10"
        style={{ bottom: insets.bottom }}
        pointerEvents="box-none"
      >
        <View
          className="w-64 h-16 flex-row items-stretch bg-deep-black rounded-4xl overflow-hidden"
        >
          <TabTrigger name="collection" asChild>
            <NavTabButton icon={Home} isLeftSide />
          </TabTrigger>
          
          <TabTrigger name="explore" asChild>
            <NavTabButton icon={Compass} isLeftSide={false} />
          </TabTrigger>
        </View>
      </View>

      {/* Centre action — floats on top of the bar's centre seam. Not a tab; it
          pushes the new-trade route. The wrapper is `box-none` so only the
          button itself catches touches. */}
      <View
        className="absolute left-0 right-0 items-center z-20"
        style={{ bottom: insets.bottom + 16}}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={() => router.push('/trades/new')}
          className="items-center justify-center"
          activeOpacity={0.85}
        >
          <View
            className="items-center justify-center rounded-full bg-pin-red border-4 border-deep-black/20"
            style={{ height: TRADE_BUTTON_SIZE, width: TRADE_BUTTON_SIZE }}
          >
            <ArrowUpDown size={24} color={Colors.offWhite} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom shadow gradient to make elements fade out */}
      <View
        className="absolute left-0 right-0 bottom-0 h-48"
        style={{ experimental_backgroundImage: 'linear-gradient(180deg, transparent, rgba(0, 14, 25, 0.3))' }}
        pointerEvents="none"
      />

      {/* Hidden — registers the routes so the triggers above resolve. */}
      <TabList style={{ display: 'none' }}>
        <TabTrigger name="explore" href="/explore" />
        <TabTrigger name="collection" href="/collection" />
      </TabList>
    </Tabs>
  )
}
