import { Stack } from 'expo-router'

export default function OrgsLayout() {
  return (
    <Stack>
      <Stack.Screen name="[orgId]" options={{ headerShown: false }} />
    </Stack>
  )
}
