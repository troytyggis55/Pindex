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
  const [wantToTradePins, setWantToTradePins] = useState<PinItem[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    const myId = session!.user.id
    Promise.all([
      supabase.from('profiles').select('username').eq('id', userId).single(),
      supabase.from('user_pins').select('*, pin:pins(*)').eq('user_id', userId).eq('want_to_trade', true),
      supabase.from('follows').select('follower_id').eq('follower_id', myId).eq('following_id', userId).maybeSingle(),
    ]).then(([profileRes, pinsRes, followRes]) => {
      if (profileRes.data) setUsername(profileRes.data.username)
      if (pinsRes.data) setWantToTradePins(pinsRes.data as PinItem[])
      setIsFollowing(!!followRes.data)
      setLoading(false)
    })
  }, [userId])

  const toggleFollow = async () => {
    const myId = session!.user.id
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', userId)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: myId, following_id: userId })
      setIsFollowing(true)
    }
    setFollowLoading(false)
  }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>@{username}</Text>
        <TouchableOpacity
          onPress={toggleFollow}
          disabled={followLoading}
          style={{
            paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
            backgroundColor: isFollowing ? '#f0f0f0' : '#000',
          }}
        >
          <Text style={{ color: isFollowing ? '#555' : '#fff', fontWeight: '600' }}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

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
