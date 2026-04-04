import { Stack } from 'expo-router'

export default function ExploreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[pinId]" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  )
}
