import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { UserPin, Pin } from '@/types'

type PinItem = UserPin & { pin: Pin }

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const { session } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [tradingPins, setTradingPins] = useState<PinItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const fetchData = async () => {
      const [profileRes, pinsRes] = await Promise.all([
        supabase.from('profiles').select('username').eq('id', userId).single(),
        supabase
          .from('user_pins')
          .select('*, pin:pins(*)')
          .eq('user_id', userId)
          .eq('status', 'trading'),
      ])
      if (profileRes.data) setUsername(profileRes.data.username)
      if (pinsRes.data) setTradingPins(pinsRes.data as PinItem[])
      setLoading(false)
    }
    fetchData()
  }, [userId])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  const isOwnProfile = userId === session?.user.id

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>{username}</Text>

      {!isOwnProfile && (
        <TouchableOpacity
          onPress={() => router.push(`/(app)/trades/new?receiverId=${userId}`)}
          style={{ backgroundColor: '#000', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12, marginBottom: 24 }}
        >
          <Text style={{ color: '#fff' }}>Trade with {username}</Text>
        </TouchableOpacity>
      )}

      <Text style={{ fontSize: 17, fontWeight: '700', marginBottom: 12, marginTop: isOwnProfile ? 16 : 0 }}>
        Available for trading ({tradingPins.length})
      </Text>

      {tradingPins.length === 0 ? (
        <Text style={{ color: '#888' }}>No pins listed for trading.</Text>
      ) : (
        tradingPins.map(item => (
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
