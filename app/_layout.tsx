import '../global.css'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '@/context/auth'

function RootLayoutNav() {
  const { session, profile, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuth = segments[0] === '(auth)'

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login')
    } else if (!profile) {
      router.replace('/(auth)/complete-profile')
    } else if (inAuth) {
      router.replace('/(app)/collection')
    }
  }, [session, profile, loading])

  return <Stack screenOptions={{ headerShown: false }} />
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}
