import { Stack } from 'expo-router'

export default function TradesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="[tradeId]" options={{ headerShown: false }} />
    </Stack>
  )
}
