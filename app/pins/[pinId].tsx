import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, RefreshControl, Image } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Users, Pencil } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { StatusChipRow } from '@/components/ui/status-chip'
import { OrgBadge } from '@/components/ui/org-badge'
import { UserRow } from '@/components/ui/user-row'
import { Colors, Radius, Spacing } from '@/constants/theme'
import type { FlagKey } from '@/constants/theme'
import type { PinWithOrg, UserPinFlags, WantToTrader } from '@/types'

type DetailTab = 'info' | 'details' | 'trade'

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: 'info', label: 'Info' },
  { key: 'details', label: 'Details' },
  { key: 'trade', label: 'Trade' },
]

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
  const [detailTab, setDetailTab] = useState<DetailTab>('info')

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
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}><ActivityIndicator /></View>
  }

  if (!pin) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}><Text style={{ fontFamily: 'Monda_400Regular' }}>Pin not found</Text></View>
  }

  const orgColor = Colors.orgFallback // future: pin.organization?.color
  const orgName = pin.organization?.name ?? 'Independent'
  const canEdit =
    (pin.created_by === session?.user.id && pin.org_claimed_at === null) ||
    (pin.org_claimed_at !== null && pin.organization?.admin_user_id === session?.user.id)

  return (
    <View style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_BOTTOM_OFFSET + 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickyHeaderIndices={[0]}
      >
        {/* Full-bleed colored header */}
        <View style={{ height: HEADER_HEIGHT, backgroundColor: orgColor }}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: insets.top + 16,
              left: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: 'rgba(0,0,0,0.2)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: Radius.btn,
            }}
          >
            <ChevronLeft size={16} color="#fff" strokeWidth={2.5} />
            <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: '#fff' }}>Back</Text>
          </TouchableOpacity>

          {/* Top-right: edit button (for owner) or unverified badge */}
          {canEdit ? (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/pins/new', params: { pinId } })}
              style={{
                position: 'absolute',
                top: insets.top + 16,
                right: 16,
                backgroundColor: 'rgba(0,0,0,0.3)',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: Radius.btn,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Pencil size={12} color="#fff" strokeWidth={2.5} />
              <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 11, color: '#fff' }}>Edit</Text>
            </TouchableOpacity>
          ) : !pin.organization_id ? (
            <View style={{
              position: 'absolute',
              top: insets.top + 16,
              right: 16,
              backgroundColor: 'rgba(0,0,0,0.3)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: Radius.btn,
            }}>
              <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 11, color: '#fff' }}>Unverified</Text>
            </View>
          ) : null}

          {/* Pin image centered */}
          {pin.image_url ? (
            <Image
              source={{ uri: pin.image_url }}
              style={{
                position: 'absolute',
                bottom: -30,
                alignSelf: 'center',
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 4,
                borderColor: 'rgba(255,255,255,0.6)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={{
              position: 'absolute',
              bottom: -30,
              alignSelf: 'center',
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderWidth: 4,
              borderColor: 'rgba(255,255,255,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 36, color: 'rgba(255,255,255,0.6)' }}>
                {pin.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        {/* Content area */}
        <View style={{ paddingHorizontal: Spacing.screenPad, paddingTop: 44 }}>
          {/* Org badge + pin name */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <OrgBadge name={orgName} logoUrl={pin.organization?.logo_url} size={20} />
              <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 13, color: Colors.dark.muted }}>
                {orgName}
              </Text>
            </View>
            <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 24, color: Colors.deepBlack, textAlign: 'center' }}>
              {pin.name}
            </Text>
          </View>

          {/* Detail tabs */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f0f0ee',
            borderRadius: Radius.btn,
            padding: 3,
            marginBottom: 20,
          }}>
            {DETAIL_TABS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setDetailTab(key)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 11,
                  alignItems: 'center',
                  backgroundColor: detailTab === key ? '#fff' : 'transparent',
                  shadowColor: detailTab === key ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: detailTab === key ? 2 : 0,
                }}
              >
                <Text style={{
                  fontFamily: 'Monda_700Bold',
                  fontSize: 13,
                  color: detailTab === key ? Colors.deepBlack : Colors.dark.muted,
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab content */}
          {detailTab === 'info' && (
            <View style={{ gap: 12 }}>
              {pin.description ? (
                <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack, lineHeight: 22 }}>
                  {pin.description}
                </Text>
              ) : (
                <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.dark.muted }}>
                  No description available.
                </Text>
              )}
              {pin.edition_size && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.dark.muted }}>Edition size</Text>
                  <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack }}>{pin.edition_size}</Text>
                </View>
              )}
            </View>
          )}

          {detailTab === 'details' && (
            <View style={{ gap: 12 }}>
              {pin.released_at && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.dark.muted }}>Released</Text>
                  <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack }}>
                    {new Date(pin.released_at).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {!pin.released_at && (
                <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.dark.muted }}>
                  No details available.
                </Text>
              )}
            </View>
          )}

          {detailTab === 'trade' && (
            <View style={{ gap: 10 }}>
              {traders.length === 0 ? (
                <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.dark.muted }}>
                  No one is currently looking to trade this pin.
                </Text>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Users size={14} color={Colors.dark.muted} strokeWidth={2} />
                    <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.dark.muted }}>
                      {traders.length} {traders.length === 1 ? 'person' : 'people'} want to trade this
                    </Text>
                  </View>
                  {traders.map(t => (
                    <UserRow
                      key={t.user_id}
                      id={t.user_id}
                      username={t.profile.username}
                      onPress={() => router.push(`/users/${t.user_id}`)}
                      showChevron
                    />
                  ))}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action bar — fixed at bottom */}
      <View style={{
        position: 'absolute',
        bottom: TAB_BAR_BOTTOM_OFFSET,
        left: 0,
        right: 0,
        backgroundColor: Colors.offWhite,
        borderTopWidth: 1,
        borderTopColor: '#e8e8e6',
        paddingHorizontal: Spacing.screenPad,
        paddingVertical: 12,
      }}>
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
            style={{
              backgroundColor: Colors.deepBlack,
              paddingVertical: 14,
              borderRadius: Radius.btn,
              alignItems: 'center',
            }}
          >
            {adding
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: '#fff' }}>Add to collection</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
