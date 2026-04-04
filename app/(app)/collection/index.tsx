import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { UserPin, Pin, Trade, TradeItem } from '@/types'

type Tab = 'pins' | 'trades' | 'following'
type CollectionItem = UserPin & { pin: Pin }
type Flag = 'in_collection' | 'wishlisted' | 'want_to_trade'
type Profile = { id: string; username: string }
type ContactRow = { id: string; name: string }
type TradeWithDetails = Trade & {
  initiator: Profile
  receiver_profile: Profile | null
  receiver_contact: ContactRow | null
  trade_items: Array<TradeItem & { pin: Pick<Pin, 'id' | 'name'> }>
}
type FollowingUser = { following_id: string; profile: Profile }

const FLAG_LABELS: Record<Flag, string> = {
  in_collection: 'Collection',
  wishlisted: 'Wishlist',
  want_to_trade: 'Trade',
}

export default function PersonalScreen() {
  const { session } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pins')
  const [pins, setPins] = useState<CollectionItem[]>([])
  const [trades, setTrades] = useState<TradeWithDetails[]>([])
  const [following, setFollowing] = useState<FollowingUser[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    if (!session?.user) return
    const myId = session.user.id
    setLoading(true)
    Promise.all([
      supabase
        .from('user_pins')
        .select('*, pin:pins(*)')
        .eq('user_id', myId)
        .order('acquired_at', { ascending: false }),
      supabase
        .from('trades')
        .select(`
          *,
          initiator:profiles!trades_initiator_id_fkey(id, username),
          receiver_profile:profiles!trades_receiver_profile_id_fkey(id, username),
          receiver_contact:contacts!trades_receiver_contact_id_fkey(id, name),
          trade_items(id, side, pin:pins(id, name))
        `)
        .or(`initiator_id.eq.${myId},receiver_profile_id.eq.${myId}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('follows')
        .select('following_id, profile:profiles!follows_following_id_fkey(id, username)')
        .eq('follower_id', myId),
    ]).then(([pinsRes, tradesRes, followingRes]) => {
      if (pinsRes.data) setPins(pinsRes.data as CollectionItem[])
      if (tradesRes.data) setTrades(tradesRes.data as TradeWithDetails[])
      if (followingRes.data) setFollowing(followingRes.data as FollowingUser[])
      setLoading(false)
    })
  }, []))

  const toggleFlag = async (id: string, flag: Flag, current: boolean) => {
    const { error } = await supabase.from('user_pins').update({ [flag]: !current }).eq('id', id)
    if (!error) setPins(prev => prev.map(i => i.id === id ? { ...i, [flag]: !current } : i))
    else Alert.alert('Error', error.message)
  }

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

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Personal</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              {session?.user.email?.[0].toUpperCase() ?? '?'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {([['pins', 'My Pins'], ['trades', 'My Trades'], ['following', 'Following']] as [Tab, string][]).map(([t, label]) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
              backgroundColor: tab === t ? '#000' : '#f0f0f0',
            }}
          >
            <Text style={{ color: tab === t ? '#fff' : '#555', fontWeight: '600', fontSize: 13 }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My Pins */}
      {tab === 'pins' && (
        <FlatList
          data={pins}
          keyExtractor={i => i.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No pins yet — browse Explore to add some!</Text>}
          renderItem={({ item }) => (
            <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>{item.pin.name}</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {(Object.keys(FLAG_LABELS) as Flag[]).map(flag => {
                  const active = item[flag] as boolean
                  return (
                    <TouchableOpacity
                      key={flag}
                      onPress={() => toggleFlag(item.id, flag, active)}
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: active ? '#000' : '#eee' }}
                    >
                      <Text style={{ color: active ? '#fff' : '#333', fontSize: 13 }}>{FLAG_LABELS[flag]}</Text>
                    </TouchableOpacity>
                  )
                })}
                <TouchableOpacity
                  onPress={() => removePin(item.id)}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#fee2e2' }}
                >
                  <Text style={{ color: '#dc2626', fontSize: 13 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* My Trades */}
      {tab === 'trades' && (
        <FlatList
          data={trades}
          keyExtractor={t => t.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No trades recorded yet.</Text>}
          renderItem={({ item }) => {
            if (!session) return null
            const myId = session.user.id
            const isInitiator = item.initiator_id === myId
            const partnerName = isInitiator
              ? (item.receiver_profile?.username ?? item.receiver_contact?.name ?? '?')
              : item.initiator.username
            const gave = item.trade_items.filter(t => isInitiator ? t.side === 'gave' : t.side === 'received')
            const received = item.trade_items.filter(t => isInitiator ? t.side === 'received' : t.side === 'gave')
            const isUnconfirmed = item.status === 'unconfirmed'
            return (
              <TouchableOpacity
                onPress={() => router.push(`/(app)/trades/${item.id}`)}
                style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontWeight: '600' }}>{partnerName}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: isUnconfirmed ? '#fef9c3' : '#dcfce7' }}>
                    <Text style={{ fontSize: 12, color: isUnconfirmed ? '#854d0e' : '#166534' }}>
                      {isUnconfirmed ? 'Unconfirmed' : 'Confirmed'}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: '#555', fontSize: 13 }}>Gave: {gave.map(t => t.pin.name).join(', ') || '—'}</Text>
                <Text style={{ color: '#555', fontSize: 13 }}>Received: {received.map(t => t.pin.name).join(', ') || '—'}</Text>
              </TouchableOpacity>
            )
          }}
        />
      )}

      {/* Following */}
      {tab === 'following' && (
        <FlatList
          data={following}
          keyExtractor={f => f.following_id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>Not following anyone yet.</Text>}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, gap: 8 }}>
              <TouchableOpacity onPress={() => router.push(`/(app)/users/${item.following_id}`)} style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600' }}>@{item.profile.username}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => unfollow(item.following_id)}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f0f0f0' }}
              >
                <Text style={{ color: '#555', fontWeight: '600', fontSize: 13 }}>Unfollow</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  )
}
