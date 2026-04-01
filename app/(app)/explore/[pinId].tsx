import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { Pin, Organization } from '@/types'

type PinWithOrg = Pin & { organization: Organization | null }
type Status = 'collection' | 'trading' | 'wishlist'

export default function PinDetailScreen() {
  const { pinId } = useLocalSearchParams<{ pinId: string }>()
  const { session } = useAuth()
  const router = useRouter()
  const [pin, setPin] = useState<PinWithOrg | null>(null)
  const [userPinId, setUserPinId] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!pinId || !session?.user) return
    const fetchData = async () => {
      const [pinRes, collectionRes] = await Promise.all([
        supabase
          .from('pins')
          .select('*, organization:organizations(*)')
          .eq('id', pinId)
          .single(),
        supabase
          .from('user_pins')
          .select('id, status')
          .eq('user_id', session.user.id)
          .eq('pin_id', pinId)
          .maybeSingle(),
      ])
      if (pinRes.data) setPin(pinRes.data as PinWithOrg)
      if (collectionRes.data) {
        setUserPinId(collectionRes.data.id)
        setCurrentStatus(collectionRes.data.status)
      }
      setLoading(false)
    }
    fetchData()
  }, [pinId])

  const addToCollection = async (status: Status) => {
    if (!session?.user || !pinId) return
    setAdding(true)
    const { data, error } = await supabase
      .from('user_pins')
      .insert({ user_id: session.user.id, pin_id: pinId, status })
      .select('id')
      .single()
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setUserPinId(data.id)
      setCurrentStatus(status)
    }
    setAdding(false)
  }

  const updateStatus = async (status: Status) => {
    if (!userPinId) return
    const { error } = await supabase.from('user_pins').update({ status }).eq('id', userPinId)
    if (!error) setCurrentStatus(status)
    else Alert.alert('Error', error.message)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!pin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Pin not found</Text>
      </View>
    )
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

      <View style={{ borderTopWidth: 1, borderColor: '#e0e0e0', paddingTop: 16, marginTop: 8 }}>
        {currentStatus ? (
          <>
            <Text style={{ fontWeight: '600', marginBottom: 8 }}>
              In your collection — currently: {currentStatus}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['collection', 'trading', 'wishlist'] as Status[]).map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => updateStatus(s)}
                  disabled={currentStatus === s}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: currentStatus === s ? '#000' : '#eee',
                  }}
                >
                  <Text style={{ color: currentStatus === s ? '#fff' : '#333', fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontWeight: '600', marginBottom: 8 }}>Add to your collection</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['collection', 'trading', 'wishlist'] as Status[]).map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => addToCollection(s)}
                  disabled={adding}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    backgroundColor: '#000',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  )
}
