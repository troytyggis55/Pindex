import { Stack } from 'expo-router'

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="[orgId]" options={{ headerShown: false }} />
      <Stack.Screen name="new-pin" options={{ headerShown: false }} />
    </Stack>
  )
}
