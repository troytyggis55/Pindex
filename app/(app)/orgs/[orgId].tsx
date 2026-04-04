import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import type { Organization, Pin } from '@/types'

export default function OrgDetailScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>()
  const router = useRouter()
  const [org, setOrg] = useState<Organization | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!orgId) return
    const [orgRes, pinsRes] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      supabase.from('pins').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    ])
    if (orgRes.data) setOrg(orgRes.data)
    if (pinsRes.data) setPins(pinsRes.data)
    setLoading(false)
    setRefreshing(false)
  }, [orgId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  if (!org) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Organization not found</Text></View>
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>{org.name}</Text>

      <Text style={{ fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 }}>
        Pins ({pins.length})
      </Text>

      {pins.length === 0 ? (
        <Text style={{ color: '#888' }}>No pins yet.</Text>
      ) : (
        pins.map(pin => (
          <TouchableOpacity
            key={pin.id}
            onPress={() => router.push(`/(app)/explore/${pin.id}`)}
            style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 8 }}
          >
            <Text style={{ fontWeight: '600', fontSize: 15 }}>{pin.name}</Text>
            {pin.description ? (
              <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }} numberOfLines={2}>{pin.description}</Text>
            ) : null}
            {pin.edition_size ? (
              <Text style={{ color: '#555', fontSize: 12, marginTop: 4 }}>Edition of {pin.edition_size}</Text>
            ) : null}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  )
}
