import { useCallback, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Plus } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { SectionHeader } from '@/components/ui/section-header'
import { PinGrid } from '@/components/ui/pin-grid'
import { Colors } from '@/constants/theme'
import type { PinWithOrg } from '@/types'

export default function CreatedPinsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()
  const [pins, setPins] = useState<PinWithOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!session?.user) return
    const { data } = await supabase
      .from('pins')
      .select('*, organization:organizations(*)')
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setPins(data as PinWithOrg[])
    setLoading(false)
    setRefreshing(false)
  }, [session?.user.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  const goToPin = (id: string) => router.push(`/pins/${id}`)

  const unclaimed = pins.filter(p => p.org_claimed_at === null)
  const claimed = pins.filter(p => p.org_claimed_at !== null)

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-off-white">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-off-white">
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-3"
        style={{ paddingTop: insets.top + 16 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1"
          hitSlop={8}
        >
          <ChevronLeft size={20} color={Colors.deepBlack} strokeWidth={2} />
          <Text className="font-monda-bold text-sm text-deep-black">Back</Text>
        </TouchableOpacity>

        <Text className="font-monda-bold text-xl text-deep-black">My Registered Pins</Text>

        <TouchableOpacity
          onPress={() => router.push('/pins/new')}
          className="flex-row items-center gap-1.5 bg-deep-black px-3 py-2 rounded-btn"
        >
          <Plus size={14} color={Colors.offWhite} strokeWidth={2.5} />
          <Text className="font-monda-bold text-[13px] text-off-white">New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {pins.length === 0 ? (
          <View className="items-center mt-[60px] gap-3">
            <Text className="font-monda text-sm text-gray-500">
              You haven't created any pins yet.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/pins/new')}
              className="bg-deep-black px-5 py-2.5 rounded-btn"
            >
              <Text className="font-monda-bold text-[13px] text-off-white">Create your first pin</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {unclaimed.length > 0 && (
              <>
                <SectionHeader label="Unclaimed" count={unclaimed.length} />
                <PinGrid pins={unclaimed} onPressPin={goToPin} />
              </>
            )}
            {claimed.length > 0 && (
              <>
                <SectionHeader label="Claimed" count={claimed.length} />
                <PinGrid pins={claimed} onPressPin={goToPin} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}
