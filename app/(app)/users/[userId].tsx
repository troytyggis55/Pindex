import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import type { UserPin, Pin } from '@/types'

type PinItem = UserPin & { pin: Pin }

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [wantToTradePins, setWantToTradePins] = useState<PinItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('profiles').select('username').eq('id', userId).single(),
      supabase
        .from('user_pins')
        .select('*, pin:pins(*)')
        .eq('user_id', userId)
        .eq('want_to_trade', true),
    ]).then(([profileRes, pinsRes]) => {
      if (profileRes.data) setUsername(profileRes.data.username)
      if (pinsRes.data) setWantToTradePins(pinsRes.data as PinItem[])
      setLoading(false)
    })
  }, [userId])

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>@{username}</Text>

      <Text style={{ fontSize: 17, fontWeight: '700', marginBottom: 12 }}>
        Open to trading ({wantToTradePins.length})
      </Text>

      {wantToTradePins.length === 0 ? (
        <Text style={{ color: '#888' }}>No pins listed for trading.</Text>
      ) : (
        wantToTradePins.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => router.push(`/(app)/explore/${item.pin_id}`)}
            style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 8 }}
          >
            <Text style={{ fontWeight: '600' }}>{item.pin.name}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  )
}
