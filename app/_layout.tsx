import '../global.css'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/context/auth'
import { useFonts, Monda_400Regular, Monda_700Bold } from '@expo-google-fonts/monda'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
  const { session, profile, loading, profileLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading || profileLoading) return

    const inAuth = segments[0] === '(auth)'

    const inApp = segments[0] === '(app)'

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login')
    } else if (!profile) {
      router.replace('/(auth)/complete-profile')
    } else if (inAuth) {
      router.replace('/(app)/collection')
    }
  }, [session, profile, loading, profileLoading])

  return <Stack screenOptions={{ headerShown: false }} />
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Monda_400Regular, Monda_700Bold })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
