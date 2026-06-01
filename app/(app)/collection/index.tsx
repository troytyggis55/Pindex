import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { PinCard } from '@/components/ui/pin-card'
import { UserRow } from '@/components/ui/user-row'
import { Avatar } from '@/components/ui/avatar'
import { TabBar } from '@/components/ui/tab-bar'
import { TradeCard } from '@/components/ui/trade-card'
import { Spacing } from '@/constants/theme'
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
          initiator:profiles!initiator_id(id, username, avatar_url),
          receiver_profile:profiles!receiver_profile_id(id, username, avatar_url),
          receiver_contact:contacts!receiver_contact_id(id, name),
          trade_items(id, side, pin:pins(id, name, image_url, organization_id, organization:organizations(color)))
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
  }, [])

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

  if (loading) {
    return <View className="flex-1 justify-center items-center bg-off-white"><ActivityIndicator /></View>
  }

  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />

  return (
    <View className="flex-1 bg-off-white">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-monda-bold text-[28px] text-deep-black">Personal</Text>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Avatar url={profile?.avatar_url} username={profile?.username ?? username} size={40} />
          </TouchableOpacity>
        </View>

        {/* Tab chips */}
        <TabBar
          tabs={TABS}
          active={tab}
          onChange={setTab}
          equalWidth
        />
      </View>

      {/* My Pins */}
      {tab === 'pins' && (
        <View className="flex-1">
          <FlatList
            data={pins}
            numColumns={3}
            keyExtractor={i => i.id}
            refreshControl={refreshControl}
            columnWrapperStyle={{ gap: Spacing.gridGap, paddingHorizontal: Spacing.screenPad }}
            contentContainerStyle={{ paddingTop: 24, paddingBottom: TAB_BAR_BOTTOM_OFFSET + 80, gap: 16 }}
            ListEmptyComponent={
              <Text className="font-monda text-gray-500 text-center mt-10">
                No pins yet — browse Explore to add some!
              </Text>
            }
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <PinCard
                  id={item.id}
                  name={item.pin.name}
                  imageUrl={item.pin.image_url}
                  orgColor={item.pin.organization?.color}
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
            className="absolute right-4 w-[52px] h-[52px] rounded-full bg-deep-black items-center justify-center"
            style={{
              bottom: TAB_BAR_BOTTOM_OFFSET + 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Plus size={22} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}

      {/* My Trades */}
      {tab === 'trades' && session && (() => {
        const myId = session.user.id
        const pendingConfirmation = trades.filter(t => t.receiver_profile_id === myId && t.status === 'unconfirmed')
        const myTrades = trades.filter(t => t.initiator_id === myId || (t.receiver_profile_id === myId && t.status === 'confirmed'))

        return (
          <FlatList
            data={myTrades}
            keyExtractor={t => t.id}
            refreshControl={refreshControl}
            contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: TAB_BAR_BOTTOM_OFFSET + 16 }}
            ListHeaderComponent={pendingConfirmation.length > 0 ? (
              <View className="mb-4">
                <Text
                  className="font-monda-bold text-[13px] text-gray-500 mb-2"
                  style={{ letterSpacing: 0.5 }}
                >
                  AWAITING YOUR CONFIRMATION ({pendingConfirmation.length})
                </Text>
                {pendingConfirmation.map(t => (
                  <View key={t.id} className="mb-2.5">
                    <TradeCard
                      trade={t}
                      currentUserId={myId}
                      isPending
                      onPress={() => router.push(`/trades/${t.id}`)}
                    />
                  </View>
                ))}
                {myTrades.length > 0 && (
                  <Text
                    className="font-monda-bold text-[13px] text-gray-500 mt-2"
                    style={{ letterSpacing: 0.5 }}
                  >
                    MY TRADES
                  </Text>
                )}
              </View>
            ) : null}
            ListEmptyComponent={pendingConfirmation.length === 0
              ? <Text className="font-monda text-gray-500 text-center mt-10">No trades recorded yet.</Text>
              : null
            }
            renderItem={({ item, index }) => (
              <TradeCard
                trade={item}
                currentUserId={myId}
                onPress={() => router.push(`/trades/${item.id}`)}
                isLast={index === myTrades.length - 1}
              />
            )}
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
            <Text className="font-monda text-gray-500 text-center mt-10">
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
