import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, RefreshControl, Image } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Users, Pencil } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { StatusChipRow } from '@/components/ui/status-chip'
import { OrgAvatar } from '@/components/ui/org-avatar'
import { UserCard } from '@/components/ui/user-card'
import { Colors } from '@/constants/theme'
import type { FlagKey } from '@/constants/theme'
import type { PinWithOrg, UserPinFlags, WantToTrader } from '@/types'

const HEADER_HEIGHT = 260
const TAB_BAR_BOTTOM_OFFSET = 84

export default function PinDetailScreen() {
  const { pinId } = useLocalSearchParams<{ pinId: string }>()
  const { session } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [pin, setPin] = useState<PinWithOrg | null>(null)
  const [userPin, setUserPin] = useState<UserPinFlags | null>(null)
  const [traders, setTraders] = useState<WantToTrader[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    if (!pinId || !session?.user) return
    const [pinRes, upRes, tradersRes] = await Promise.all([
      supabase.from('pins').select('*, organization:organizations(*)').eq('id', pinId).single(),
      supabase
        .from('user_pins')
        .select('id, in_collection, wishlisted, want_to_trade')
        .eq('user_id', session.user.id)
        .eq('pin_id', pinId)
        .maybeSingle(),
      supabase
        .from('user_pins')
        .select('user_id, profile:profiles(username)')
        .eq('pin_id', pinId)
        .eq('want_to_trade', true)
        .neq('user_id', session.user.id),
    ])
    if (pinRes.data) setPin(pinRes.data as PinWithOrg)
    if (upRes.data) setUserPin(upRes.data)
    if (tradersRes.data) setTraders(tradersRes.data as WantToTrader[])
    setLoading(false)
    setRefreshing(false)
  }, [pinId, session?.user.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  const addToCollection = async () => {
    if (!session?.user || !pinId) return
    setAdding(true)
    const { data, error } = await supabase
      .from('user_pins')
      .insert({ user_id: session.user.id, pin_id: pinId, in_collection: true })
      .select('id, in_collection, wishlisted, want_to_trade')
      .single()
    if (error) Alert.alert('Error', error.message)
    else setUserPin(data)
    setAdding(false)
  }

  const toggleFlag = async (flag: FlagKey) => {
    if (!userPin) return
    const next = !userPin[flag]
    const { error } = await supabase.from('user_pins').update({ [flag]: next }).eq('id', userPin.id)
    if (!error) setUserPin(prev => prev ? { ...prev, [flag]: next } : null)
    else Alert.alert('Error', error.message)
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-off-white">
        <ActivityIndicator />
      </View>
    )
  }

  if (!pin) {
    return (
      <View className="flex-1 justify-center items-center bg-off-white">
        <Text className="font-monda">Pin not found</Text>
      </View>
    )
  }

  const orgColor = pin.organization?.color ?? Colors.orgFallback
  const orgName = pin.organization?.name ?? 'Independent'
  const canEdit =
    (pin.created_by === session?.user.id && pin.org_claimed_at === null) ||
    (pin.org_claimed_at !== null && pin.organization?.admin_user_id === session?.user.id)

  return (
    <View className="flex-1 bg-off-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_BOTTOM_OFFSET + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickyHeaderIndices={[0]}
      >
        {/* Full-bleed colored header */}
        <View style={{ height: HEADER_HEIGHT, backgroundColor: orgColor }}>

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-4 flex-row items-center gap-1 bg-black/20 px-3 py-1.5 rounded-btn"
            style={{ top: insets.top + 16 }}
          >
            <ChevronLeft size={16} color="#fff" strokeWidth={2.5} />
            <Text className="font-monda-bold text-[13px] text-white">Back</Text>
          </TouchableOpacity>

          {/* Top-right: edit button (for owner) or unverified badge */}
          {canEdit ? (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/pins/new', params: { pinId } })}
              className="absolute right-4 bg-black/30 px-2.5 py-1.5 rounded-btn flex-row items-center gap-[5px]"
              style={{ top: insets.top + 16 }}
            >
              <Pencil size={12} color="#fff" strokeWidth={2.5} />
              <Text className="font-monda-bold text-[11px] text-white">Edit</Text>
            </TouchableOpacity>
          ) : !pin.organization_id ? (
            <View
              className="absolute right-4 bg-black/30 px-2.5 py-1 rounded-btn"
              style={{ top: insets.top + 16 }}
            >
              <Text className="font-monda text-[11px] text-white">Unverified</Text>
            </View>
          ) : null}

          {/* Pin image centered */}
          {pin.image_url ? (
            <Image
              source={{ uri: pin.image_url }}
              className="absolute self-center bottom-[-30px] border-4 border-white/60"
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="absolute self-center bottom-[-30px] border-4 border-white/40 items-center justify-center bg-white/25"
              style={{ width: 120, height: 120, borderRadius: 60 }}
            >
              <Text className="font-monda-bold text-[36px] text-white/60">
                {pin.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        {/* Content area */}
        <View className="px-4 pt-11">
          {/* Org badge + pin name */}
          <View className="items-center mb-5">
            <View className="flex-row items-center gap-1.5 mb-2">
              <OrgAvatar name={orgName} logoUrl={pin.organization?.logo_url} color={pin.organization?.color} size={20} />
              <Text className="font-monda text-[13px] text-gray-500">
                {orgName}
              </Text>
            </View>
            <Text className="font-monda-bold text-2xl text-deep-black text-center">
              {pin.name}
            </Text>
          </View>

          {/* Description */}
          <View className="gap-3 mb-6">
            {pin.description ? (
              <Text className="font-monda text-sm text-deep-black leading-[22px]">
                {pin.description}
              </Text>
            ) : (
              <Text className="font-monda text-sm text-gray-500">
                No description available.
              </Text>
            )}
            {pin.edition_size && (
              <View className="flex-row justify-between">
                <Text className="font-monda text-sm text-gray-500">Edition size</Text>
                <Text className="font-monda-bold text-sm text-deep-black">{pin.edition_size}</Text>
              </View>
            )}
            {pin.released_at && (
              <View className="flex-row justify-between">
                <Text className="font-monda text-sm text-gray-500">Released</Text>
                <Text className="font-monda-bold text-sm text-deep-black">
                  {new Date(pin.released_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Traders */}
          {traders.length > 0 && (
            <View className="gap-[10px]">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Users size={14} color={Colors.dark.muted} strokeWidth={2} />
                <Text className="font-monda-bold text-[13px] text-gray-500">
                  {traders.length} {traders.length === 1 ? 'person' : 'people'} up to trade this pin
                </Text>
              </View>
              {traders.map(t => (
                <UserCard
                  key={t.user_id}
                  id={t.user_id}
                  username={t.profile.username}
                  onPress={() => router.push(`/users/${t.user_id}`)}
                  showChevron
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action bar — fixed at bottom */}
      <View className="absolute bottom-[84px] left-0 right-0 bg-off-white border-t border-t-[#e8e8e6] px-4 py-3">
        {userPin ? (
          <StatusChipRow
            in_collection={userPin.in_collection}
            wishlisted={userPin.wishlisted}
            want_to_trade={userPin.want_to_trade}
            onToggle={toggleFlag}
          />
        ) : (
          <TouchableOpacity
            onPress={addToCollection}
            disabled={adding}
            className="bg-deep-black py-[14px] rounded-btn items-center"
          >
            {adding
              ? <ActivityIndicator color="#fff" />
              : <Text className="font-monda-bold text-sm text-white">Add to collection</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
