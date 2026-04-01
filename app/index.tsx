import { View, ActivityIndicator } from 'react-native'

// Root redirect — _layout.tsx handles navigation based on auth state
export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}
