import { Tabs, useRouter } from 'expo-router'
import { TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Compass, User, ArrowLeftRight } from 'lucide-react-native'
import { Colors } from '@/constants/theme'

const TAB_BAR_HEIGHT = 60

function NewTradeButton() {
  const router = useRouter()
  return (
    <TouchableOpacity
      onPress={() => router.push('/trades/new')}
      style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
      activeOpacity={0.8}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: Colors.red,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: Colors.red,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <ArrowLeftRight size={20} color="#fff" strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  )
}

export default function AppLayout() {
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { paddingTop: insets.top, backgroundColor: Colors.offWhite },
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: insets.bottom + 12,
          left: 32,
          right: 32,
          height: TAB_BAR_HEIGHT,
          borderRadius: TAB_BAR_HEIGHT / 2,
          backgroundColor: Colors.deepBlack,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: Colors.dark.muted,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => <Compass size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          tabBarButton: () => <NewTradeButton />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  )
}
