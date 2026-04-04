import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { Pin, Organization, UserPin } from '@/types'

type PinWithOrg = Pin & { organization: Organization | null }
type UserPinFlags = Pick<UserPin, 'id' | 'in_collection' | 'wishlisted' | 'want_to_trade'>
type WantToTrader = { user_id: string; profile: { username: string } }
type Flag = 'in_collection' | 'wishlisted' | 'want_to_trade'

const FLAG_LABELS: Record<Flag, string> = {
  in_collection: 'Collection',
  wishlisted: 'Wishlist',
  want_to_trade: 'Trade',
}

export default function PinDetailScreen() {
  const { pinId } = useLocalSearchParams<{ pinId: string }>()
  const { session } = useAuth()
  const router = useRouter()
  const [pin, setPin] = useState<PinWithOrg | null>(null)
  const [userPin, setUserPin] = useState<UserPinFlags | null>(null)
  const [traders, setTraders] = useState<WantToTrader[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!pinId || !session?.user) return
    Promise.all([
      supabase.from('pins').select('*, organization:organizations(*)').eq('id', pinId).single(),
      supabase
        .from('user_pins')
        .select('id, in_collection, wishlisted, want_to_trade')
        .eq('user_id', session.user.id)
        .eq('pin_id', pinId)
        .maybeSingle(),
      supabase
        .from('user_pins')
        .select('user_id, profile:profiles(username)')
        .eq('pin_id', pinId)
        .eq('want_to_trade', true)
        .neq('user_id', session.user.id),
    ]).then(([pinRes, upRes, tradersRes]) => {
      if (pinRes.data) setPin(pinRes.data as PinWithOrg)
      if (upRes.data) setUserPin(upRes.data)
      if (tradersRes.data) setTraders(tradersRes.data as WantToTrader[])
      setLoading(false)
    })
  }, [pinId])

  const addToCollection = async () => {
    if (!session?.user || !pinId) return
    setAdding(true)
    const { data, error } = await supabase
      .from('user_pins')
      .insert({ user_id: session.user.id, pin_id: pinId, in_collection: true })
      .select('id, in_collection, wishlisted, want_to_trade')
      .single()
    if (error) Alert.alert('Error', error.message)
    else setUserPin(data)
    setAdding(false)
  }

  const toggleFlag = async (flag: Flag) => {
    if (!userPin) return
    const next = !userPin[flag]
    const { error } = await supabase.from('user_pins').update({ [flag]: next }).eq('id', userPin.id)
    if (!error) setUserPin(prev => prev ? { ...prev, [flag]: next } : null)
    else Alert.alert('Error', error.message)
  }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  if (!pin) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Pin not found</Text></View>
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 4 }}>{pin.name}</Text>
      <Text style={{ color: '#555', fontSize: 15, marginBottom: 12 }}>
        {pin.organization?.name ?? 'Independent'}
      </Text>

      {pin.description && (
        <Text style={{ color: '#333', marginBottom: 12 }}>{pin.description}</Text>
      )}
      {pin.edition_size && (
        <Text style={{ color: '#555', marginBottom: 4 }}>Edition size: {pin.edition_size}</Text>
      )}
      {pin.released_at && (
        <Text style={{ color: '#555', marginBottom: 16 }}>
          Released: {new Date(pin.released_at).toLocaleDateString()}
        </Text>
      )}

      {traders.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Open to trading ({traders.length})</Text>
          {traders.map(t => (
            <TouchableOpacity
              key={t.user_id}
              onPress={() => router.push(`/(app)/users/${t.user_id}`)}
              style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' }}
            >
              <Text style={{ color: '#333' }}>@{t.profile.username} →</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ borderTopWidth: 1, borderColor: '#e0e0e0', paddingTop: 16, marginTop: 8 }}>
        {userPin ? (
          <>
            <Text style={{ fontWeight: '600', marginBottom: 8 }}>In your list</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(Object.keys(FLAG_LABELS) as Flag[]).map(flag => {
                const active = userPin[flag]
                return (
                  <TouchableOpacity
                    key={flag}
                    onPress={() => toggleFlag(flag)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      backgroundColor: active ? '#000' : '#eee',
                    }}
                  >
                    <Text style={{ color: active ? '#fff' : '#333', fontSize: 13 }}>
                      {FLAG_LABELS[flag]}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontWeight: '600', marginBottom: 8 }}>Add to your list</Text>
            <TouchableOpacity
              onPress={addToCollection}
              disabled={adding}
              style={{ backgroundColor: '#000', padding: 12, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff' }}>Add to collection</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  )
}
