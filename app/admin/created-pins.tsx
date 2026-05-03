import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Plus } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { PinCard } from '@/components/ui/pin-card'
import { Colors, Radius, Spacing } from '@/constants/theme'

type CreatedPin = {
  id: string
  name: string
  image_url: string | null
  organization_id: string | null
  org_claimed_at: string | null
  organization: { name: string; logo_url: string | null } | null
}

export default function CreatedPinsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const [pins, setPins] = useState<CreatedPin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!session?.user) return
    const { data } = await supabase
      .from('pins')
      .select('id, name, image_url, organization_id, org_claimed_at, organization:organizations(name, logo_url)')
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setPins(data as CreatedPin[])
    setLoading(false)
    setRefreshing(false)
  }, [session?.user.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}><ActivityIndicator /></View>
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: Spacing.screenPad,
        paddingTop: insets.top + 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <ChevronLeft size={20} color={Colors.deepBlack} strokeWidth={2} />
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 20, color: Colors.deepBlack }}>
          My Created Pins
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/pins/new')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: Colors.deepBlack,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: Radius.btn,
          }}
        >
          <Plus size={14} color="#fff" strokeWidth={2.5} />
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: '#fff' }}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pins}
        numColumns={3}
        keyExtractor={p => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        columnWrapperStyle={{ gap: Spacing.gridGap, paddingHorizontal: Spacing.screenPad }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48, gap: 16 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60, gap: 12 }}>
            <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.dark.muted }}>
              You haven't created any pins yet.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/pins/new')}
              style={{
                backgroundColor: Colors.deepBlack,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: Radius.btn,
              }}
            >
              <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: '#fff' }}>Create your first pin</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <PinCard
              id={item.id}
              name={item.name}
              imageUrl={item.image_url}
              orgName={item.organization?.name ?? 'Independent'}
              orgLogoUrl={item.organization?.logo_url}
              isConfirmed={item.org_claimed_at != null}
              onPress={() => router.push(`/pins/${item.id}`)}
            />
          </View>
        )}
      />
    </View>
  )
}
