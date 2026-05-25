import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Image } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Plus, ChevronRight } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { PinCard } from '@/components/ui/pin-card'
import { UserRow } from '@/components/ui/user-row'
import { Colors, Radius, Spacing } from '@/constants/theme'
import type { CollectionItem, TradeWithDetails, FollowingUser } from '@/types'

type Tab = 'pins' | 'trades' | 'following'

const TABS: { key: Tab; label: string }[] = [
  { key: 'pins', label: 'My Pins' },
  { key: 'trades', label: 'My Trades' },
  { key: 'following', label: 'Following' },
]

const TAB_BAR_BOTTOM_OFFSET = 84

export default function PersonalScreen() {
  const { session, profile } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pins')
  const [pins, setPins] = useState<CollectionItem[]>([])
  const [trades, setTrades] = useState<TradeWithDetails[]>([])
  const [following, setFollowing] = useState<FollowingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!session?.user) return
    const myId = session.user.id
    const [pinsRes, tradesRes, followingRes] = await Promise.all([
      supabase
        .from('user_pins')
        .select('*, pin:pins(*, organization:organizations(*))')
        .eq('user_id', myId)
        .order('acquired_at', { ascending: false }),
      supabase
        .from('trades')
        .select(`
          *,
          initiator:profiles!initiator_id(id, username),
          receiver_profile:profiles!receiver_profile_id(id, username),
          receiver_contact:contacts!receiver_contact_id(id, name),
          trade_items(id, side, pin:pins(id, name))
        `)
        .or(`initiator_id.eq.${myId},receiver_profile_id.eq.${myId}`)
        .order('confirmed_at', { ascending: false, nullsFirst: true }),
      supabase
        .from('follows')
        .select('following_id, profile:profiles!following_id(id, username, avatar_url)')
        .eq('follower_id', myId),
    ])
    if (pinsRes.data) setPins(pinsRes.data as CollectionItem[])
    if (tradesRes.data) setTrades(tradesRes.data as TradeWithDetails[])
    if (followingRes.data) setFollowing(followingRes.data as FollowingUser[])
    setLoading(false)
    setRefreshing(false)
  }, [session?.user.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  const removePin = async (id: string) => {
    Alert.alert('Remove pin', 'Remove this pin from your list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('user_pins').delete().eq('id', id)
          if (!error) setPins(prev => prev.filter(i => i.id !== id))
          else Alert.alert('Error', error.message)
        },
      },
    ])
  }

  const unfollow = async (followingId: string) => {
    const myId = session!.user.id
    await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', followingId)
    setFollowing(prev => prev.filter(f => f.following_id !== followingId))
  }

  const username = session?.user.email?.split('@')[0] ?? '?'
  const initial = username.charAt(0).toUpperCase()

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}><ActivityIndicator /></View>
  }

  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />

  return (
    <View style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      {/* Header */}
      <View style={{ paddingHorizontal: Spacing.screenPad, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 28, color: Colors.deepBlack }}>Personal</Text>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: Colors.deepBlack,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 16, color: '#fff' }}>{initial}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab chips */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {TABS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: Radius.btn,
                alignItems: 'center',
                backgroundColor: tab === key ? Colors.deepBlack : 'transparent',
                borderWidth: 1,
                borderColor: tab === key ? Colors.deepBlack : '#d0d0ce',
              }}
            >
              <Text style={{
                fontFamily: 'Monda_700Bold',
                fontSize: 11,
                color: tab === key ? '#fff' : Colors.dark.muted,
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* My Pins */}
      {tab === 'pins' && (
        <View style={{ flex: 1 }}>
          <FlatList
            data={pins}
            numColumns={3}
            keyExtractor={i => i.id}
            refreshControl={refreshControl}
            columnWrapperStyle={{ gap: Spacing.gridGap, paddingHorizontal: Spacing.screenPad }}
            contentContainerStyle={{ paddingTop: 24, paddingBottom: TAB_BAR_BOTTOM_OFFSET + 80, gap: 16 }}
            ListEmptyComponent={
              <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }}>
                No pins yet — browse Explore to add some!
              </Text>
            }
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <PinCard
                  id={item.id}
                  name={item.pin.name}
                  imageUrl={item.pin.image_url}
                  orgName={item.pin.organization?.name ?? 'Independent'}
                  orgLogoUrl={item.pin.organization?.logo_url}
                  isConfirmed={item.pin.organization_id != null}
                  flags={{
                    in_collection: item.in_collection,
                    wishlisted: item.wishlisted,
                    want_to_trade: item.want_to_trade,
                  }}
                  onPress={() => router.push(`/pins/${item.pin_id}`)}
                />
              </View>
            )}
          />

          {/* Floating add button */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/explore')}
            style={{
              position: 'absolute',
              bottom: TAB_BAR_BOTTOM_OFFSET + 16,
              right: Spacing.screenPad,
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: Colors.deepBlack,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Plus size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}

      {/* My Trades */}
      {tab === 'trades' && session && (() => {
        const myId = session.user.id
        const pendingConfirmation = trades.filter(t => t.receiver_profile_id === myId && t.status === 'unconfirmed')
        const myTrades = trades.filter(t => t.initiator_id === myId || (t.receiver_profile_id === myId && t.status === 'confirmed'))

        const renderTrade = (item: TradeWithDetails, isPending = false) => {
          const isInitiator = item.initiator_id === myId
          const partnerName = isInitiator
            ? (item.receiver_profile?.username ?? item.receiver_contact?.name ?? '?')
            : item.initiator.username
          const gave = item.trade_items.filter(t => isInitiator ? t.side === 'gave' : t.side === 'received')
          const received = item.trade_items.filter(t => isInitiator ? t.side === 'received' : t.side === 'gave')
          const isUnconfirmed = item.status === 'unconfirmed'

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(`/trades/${item.id}`)}
              style={{
                backgroundColor: '#fff',
                borderRadius: Radius.card,
                padding: 14,
                borderWidth: isPending ? 1.5 : 0,
                borderColor: isPending ? Colors.yellow : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack }}>
                  {partnerName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: isUnconfirmed ? '#fef3c7' : '#dcfce7',
                  }}>
                    <Text style={{
                      fontFamily: 'Monda_700Bold',
                      fontSize: 11,
                      color: isUnconfirmed ? '#92400e' : '#166534',
                    }}>
                      {isUnconfirmed ? 'Unconfirmed' : 'Confirmed'}
                    </Text>
                  </View>
                  <ChevronRight size={14} color={Colors.dark.muted} strokeWidth={2} />
                </View>
              </View>
              <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 13, color: Colors.dark.muted }}>
                Gave: {gave.map(t => t.pin.name).join(', ') || '—'}
              </Text>
              <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 13, color: Colors.dark.muted }}>
                Received: {received.map(t => t.pin.name).join(', ') || '—'}
              </Text>
            </TouchableOpacity>
          )
        }

        return (
          <FlatList
            data={myTrades}
            keyExtractor={t => t.id}
            refreshControl={refreshControl}
            contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: TAB_BAR_BOTTOM_OFFSET + 16, gap: 10 }}
            ListHeaderComponent={pendingConfirmation.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.dark.muted, marginBottom: 8, letterSpacing: 0.5 }}>
                  AWAITING YOUR CONFIRMATION ({pendingConfirmation.length})
                </Text>
                {pendingConfirmation.map(t => (
                  <View key={t.id} style={{ marginBottom: 10 }}>{renderTrade(t, true)}</View>
                ))}
                {myTrades.length > 0 && (
                  <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.dark.muted, marginTop: 8, marginBottom: 0, letterSpacing: 0.5 }}>
                    MY TRADES
                  </Text>
                )}
              </View>
            ) : null}
            ListEmptyComponent={pendingConfirmation.length === 0
              ? <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }}>No trades recorded yet.</Text>
              : null
            }
            renderItem={({ item }) => renderTrade(item)}
          />
        )
      })()}

      {/* Following */}
      {tab === 'following' && (
        <FlatList
          data={following}
          keyExtractor={f => f.following_id}
          refreshControl={refreshControl}
          contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: TAB_BAR_BOTTOM_OFFSET + 16, gap: 10 }}
          ListEmptyComponent={
            <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }}>
              Not following anyone yet.
            </Text>
          }
          renderItem={({ item }) => (
            <UserRow
              id={item.following_id}
              username={item.profile.username}
              avatarUrl={item.profile.avatar_url}
              onPress={() => router.push(`/users/${item.following_id}`)}
              isFollowing
              onFollowToggle={() => unfollow(item.following_id)}
            />
          )}
        />
      )}

    </View>
  )
}
