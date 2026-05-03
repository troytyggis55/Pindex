import { useCallback, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
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

function PinGrid({ pins, onPress }: { pins: CreatedPin[]; onPress: (id: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.screenPad }}>
      {pins.map(pin => (
        <View key={pin.id} style={{ width: '33.33%', alignItems: 'center', marginBottom: 16 }}>
          <PinCard
            id={pin.id}
            name={pin.name}
            imageUrl={pin.image_url}
            orgName={pin.organization?.name ?? 'Independent'}
            orgLogoUrl={pin.organization?.logo_url}
            isConfirmed={pin.org_claimed_at != null}
            onPress={() => onPress(pin.id)}
          />
        </View>
      ))}
    </View>
  )
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: Spacing.screenPad, paddingTop: 20, paddingBottom: 12,
    }}>
      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack }}>{label}</Text>
      <View style={{
        backgroundColor: Colors.deepBlack,
        paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 10,
      }}>
        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 11, color: '#fff' }}>{count}</Text>
      </View>
    </View>
  )
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

  const goToPin = (id: string) => router.push(`/pins/${id}`)

  const unclaimed = pins.filter(p => p.org_claimed_at === null)
  const claimed = pins.filter(p => p.org_claimed_at !== null)

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

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {pins.length === 0 ? (
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
        ) : (
          <>
            {unclaimed.length > 0 && (
              <>
                <SectionHeader label="Unclaimed" count={unclaimed.length} />
                <PinGrid pins={unclaimed} onPress={goToPin} />
              </>
            )}
            {claimed.length > 0 && (
              <>
                <SectionHeader label="Claimed" count={claimed.length} />
                <PinGrid pins={claimed} onPress={goToPin} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}
