import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import type { Pin, Organization } from '@/types'

type PinWithOrg = Pin & { organization: Organization | null }

export default function ExploreScreen() {
  const [pins, setPins] = useState<PinWithOrg[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase
      .from('pins')
      .select('*, organization:organizations(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setPins(data as PinWithOrg[])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Explore Pins</Text>
      <FlatList
        data={pins}
        keyExtractor={p => p.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/explore/${item.id}`)}
            style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: '#555', fontSize: 13 }}>
              {item.organization?.name ?? 'Independent'}
            </Text>
            {item.description && (
              <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
