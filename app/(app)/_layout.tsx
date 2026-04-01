import { Tabs } from 'expo-router'

export default function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="collection" options={{ title: 'Collection', tabBarLabel: 'Collection' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarLabel: 'Explore' }} />
    </Tabs>
  )
}
