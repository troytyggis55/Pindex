import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { PinCard } from '@/components/ui/pin-card'
import { OrgBadge } from '@/components/ui/org-badge'
import { Colors, Radius, Spacing } from '@/constants/theme'
import type { Organization, Pin } from '@/types'

export default function OrgDetailScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
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
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}><ActivityIndicator /></View>
  }

  if (!org) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}><Text style={{ fontFamily: 'Monda_400Regular' }}>Organization not found.</Text></View>
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.offWhite }}
      contentContainerStyle={{ padding: Spacing.screenPad, paddingTop: insets.top + 16, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        <ChevronLeft size={20} color={Colors.deepBlack} strokeWidth={2} />
        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack }}>Back</Text>
      </TouchableOpacity>

      {/* Org header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <OrgBadge name={org.name} logoUrl={org.logo_url} size={48} />
        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 24, color: Colors.deepBlack }}>{org.name}</Text>
      </View>

      {/* Pins section */}
      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack, marginBottom: 12 }}>
        Pins ({pins.length})
      </Text>

      {pins.length === 0 ? (
        <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted }}>No pins yet.</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.gridGap }}>
          {pins.map(pin => (
            <View key={pin.id} style={{ width: '31%' }}>
              <PinCard
                id={pin.id}
                name={pin.name}
                imageUrl={pin.image_url}
                orgName={org.name}
                orgLogoUrl={org.logo_url}
                isConfirmed={pin.org_claimed_at != null}
                onPress={() => router.push(`/pins/${pin.id}`)}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}
