import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { UserPin, Pin } from '@/types'

type CollectionItem = UserPin & { pin: Pin }

const STATUSES = ['collection', 'trading', 'wishlist'] as const
type Status = (typeof STATUSES)[number]

export default function CollectionScreen() {
  const { session } = useAuth()
  const [items, setItems] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCollection = async () => {
    if (!session?.user) return
    const { data, error } = await supabase
      .from('user_pins')
      .select('*, pin:pins(*)')
      .eq('user_id', session.user.id)
      .order('acquired_at', { ascending: false })
    if (!error && data) setItems(data as CollectionItem[])
    setLoading(false)
  }

  useEffect(() => { fetchCollection() }, [])

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from('user_pins').update({ status }).eq('id', id)
    if (!error) {
      setItems(prev => prev.map(i => (i.id === id ? { ...i, status } : i)))
    } else {
      Alert.alert('Error', error.message)
    }
  }

  const removePin = async (id: string) => {
    Alert.alert('Remove pin', 'Remove this pin from your collection?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('user_pins').delete().eq('id', id)
          if (!error) setItems(prev => prev.filter(i => i.id !== id))
          else Alert.alert('Error', error.message)
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
        My Collection ({items.length})
      </Text>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
            No pins yet — browse the Explore tab to add some!
          </Text>
        }
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.pin.name}</Text>
            <Text style={{ color: '#555', marginBottom: 8 }}>Status: {item.status}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => updateStatus(item.id, s)}
                  disabled={item.status === s}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: item.status === s ? '#000' : '#eee',
                  }}
                >
                  <Text style={{ color: item.status === s ? '#fff' : '#333', fontSize: 13 }}>{s}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => removePin(item.id)}
                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#fee2e2' }}
              >
                <Text style={{ color: '#dc2626', fontSize: 13 }}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  )
}
