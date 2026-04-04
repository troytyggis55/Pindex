import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import type { Pin, Organization } from '@/types'

type PinWithOrg = Pin & { organization: Organization | null }

export default function ExploreScreen() {
  const [pins, setPins] = useState<PinWithOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const router = useRouter()

  useFocusEffect(useCallback(() => {
    supabase
      .from('pins')
      .select('*, organization:organizations(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setPins(data as PinWithOrg[])
        setLoading(false)
      })
  }, []))

  const filtered = query.trim()
    ? pins.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : pins

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Explore</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/explore/new')}
          style={{ backgroundColor: '#000', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>+ New Pin</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search pins..."
        style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, marginBottom: 12 }}
      />

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No pins found.</Text>}
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
