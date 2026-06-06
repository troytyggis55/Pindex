import { Stack } from 'expo-router'
import { useAuth } from '@/context/auth'

export default function AuthLayout() {
  const { session } = useAuth()

  // The root layout only mounts this group when the user isn't fully
  // authenticated. A session here means the account exists but has no profile
  // yet, so route them to complete-profile; otherwise show the sign-in screens.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
        <Stack.Screen name="complete-profile" />
      </Stack.Protected>
    </Stack>
  )
}
