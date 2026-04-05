import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '@/context/auth'

export default function Index() {
  const { session, profile, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (session && profile) {
    return <Redirect href="/(app)/collection" />
  }

  // No session or incomplete profile — _layout.tsx handles the redirect
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}
