import { Tabs, useRouter } from 'expo-router'
import { TouchableOpacity, View, Text } from 'react-native'

function NewTradeButton() {
  const router = useRouter()
  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/trades/new')}
      style={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 26, lineHeight: 30, fontWeight: '300' }}>+</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarLabel: 'Explore' }} />
      <Tabs.Screen
        name="trades"
        options={{
          tabBarButton: () => <NewTradeButton />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen name="collection" options={{ title: 'Collection', tabBarLabel: 'Collection' }} />
      <Tabs.Screen name="users" options={{ href: null }} />
    </Tabs>
  )
}
