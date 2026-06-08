import '../global.css'
import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/context/auth'
import { useFonts, Monda_400Regular, Monda_700Bold } from '@expo-google-fonts/monda'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'

SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
  const { session, profile, loading, profileLoading } = useAuth()
  const authed = !!session && !!profile

  // Hold a splash until auth state is fully known so we never flash an auth
  // screen first. The second clause keeps the splash up while the initial
  // profile is being fetched for a known session; token refreshes keep
  // `profile` set, so this never re-triggers once resolved.
  if (loading || (!!session && !profile && profileLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-off-white">
        <ActivityIndicator />
      </View>
    )
  }

  // Declarative guards replace imperative redirects: when `authed` flips false
  // on sign-out, the protected screens (and their history) are removed, so the
  // back gesture from login exits the app instead of re-entering a stale screen.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={authed}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="pins/[pinId]" />
        <Stack.Screen name="pins/new" />
        <Stack.Screen name="trades/[tradeId]" />
        <Stack.Screen name="trades/new" />
        <Stack.Screen name="users/[userId]" />
        <Stack.Screen name="orgs/[orgId]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="admin/[orgId]" />
        <Stack.Screen name="admin/created-pins" />
      </Stack.Protected>

      <Stack.Protected guard={!authed}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* enter-code and reset-password are intentionally unguarded: verifying
          the recovery code creates a session, so they must stay reachable in
          any auth state. */}
    </Stack>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Monda_400Regular, Monda_700Bold })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView>
      <KeyboardProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}
