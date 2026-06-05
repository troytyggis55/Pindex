import { useCallback, useState } from 'react'
import { View, Text, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { PinCard } from '@/components/ui/pin-card'
import { OrgCard } from '@/components/ui/org-card'
import { ScreenHeader } from '@/components/ui/screen-header'
import { Spacing } from '@/constants/theme'
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
    return (
      <View className="flex-1 justify-center items-center bg-off-white">
        <ActivityIndicator />
      </View>
    )
  }

  if (!org) {
    return (
      <View className="flex-1 justify-center items-center bg-off-white">
        <Text className="font-monda">Organization not found.</Text>
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-off-white"
      contentContainerStyle={{ padding: Spacing.screenPad, paddingTop: insets.top + 16, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader onBack={() => router.back()} />

      {/* Org header */}
      <View className="flex-row items-center gap-3 mb-7">
        <OrgCard name={org.name} logoUrl={org.logo_url} size={48} />
        <View>
          <Text className="font-monda-bold text-[24px] text-deep-black">{org.name}</Text>
          {org.color && (
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: org.color }} />
              <Text className="font-monda text-[12px] text-gray-400">{org.color}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Pins section */}
      <Text className="font-monda-bold text-[15px] text-deep-black mb-3">
        Pins ({pins.length})
      </Text>

      {pins.length === 0 ? (
        <Text className="font-monda text-gray-500">No pins yet.</Text>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {pins.map(pin => (
            <View key={pin.id} className="w-[31%]">
              <PinCard
                id={pin.id}
                name={pin.name}
                imageUrl={pin.image_url}
                orgName={org.name}
                orgColor={org.color}
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
