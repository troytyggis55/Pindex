import { Stack } from 'expo-router'

export default function UsersLayout() {
  return (
    <Stack>
      <Stack.Screen name="[userId]" options={{ headerShown: false }} />
    </Stack>
  )
}
