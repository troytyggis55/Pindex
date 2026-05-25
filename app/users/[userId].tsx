import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { PinCard } from '@/components/ui/pin-card'
import { Avatar } from '@/components/ui/avatar'
import { ScreenHeader } from '@/components/ui/screen-header'
import { Colors, Radius, Spacing } from '@/constants/theme'
import type { CollectionItem } from '@/types'

type PinItem = CollectionItem

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const { session } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [wantToTradePins, setWantToTradePins] = useState<PinItem[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    const myId = session!.user.id
    const [profileRes, pinsRes, followRes] = await Promise.all([
      supabase.from('profiles').select('username, avatar_url').eq('id', userId).single(),
      supabase
        .from('user_pins')
        .select('*, pin:pins(*, organization:organizations(name, logo_url))')
        .eq('user_id', userId)
        .eq('want_to_trade', true),
      supabase.from('follows').select('follower_id').eq('follower_id', myId).eq('following_id', userId).maybeSingle(),
    ])
    if (profileRes.data) {
      setUsername(profileRes.data.username)
      setAvatarUrl(profileRes.data.avatar_url ?? null)
    }
    if (pinsRes.data) setWantToTradePins(pinsRes.data as PinItem[])
    setIsFollowing(!!followRes.data)
    setLoading(false)
    setRefreshing(false)
  }, [userId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  const toggleFollow = async () => {
    const myId = session!.user.id
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', userId)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: myId, following_id: userId })
      setIsFollowing(true)
    }
    setFollowLoading(false)
  }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}><ActivityIndicator /></View>
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.offWhite }}
      contentContainerStyle={{ padding: Spacing.screenPad, paddingTop: insets.top + 16, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ScreenHeader onBack={() => router.back()} />

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Avatar url={avatarUrl} username={username} size={72} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 24, color: Colors.deepBlack }}>@{username}</Text>
        <TouchableOpacity
          onPress={toggleFollow}
          disabled={followLoading}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: Radius.btn,
            backgroundColor: isFollowing ? 'transparent' : Colors.deepBlack,
            borderWidth: 1,
            borderColor: isFollowing ? '#d0d0ce' : Colors.deepBlack,
          }}
        >
          {followLoading
            ? <ActivityIndicator color={isFollowing ? Colors.dark.muted : '#fff'} size="small" />
            : <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: isFollowing ? Colors.dark.muted : '#fff' }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack, marginBottom: 16 }}>
        Open to trading ({wantToTradePins.length})
      </Text>

      {wantToTradePins.length === 0 ? (
        <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted }}>No pins listed for trading.</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.gridGap }}>
          {wantToTradePins.map(item => (
            <View key={item.id} style={{ width: '31%' }}>
              <PinCard
                id={item.id}
                name={item.pin.name}
                imageUrl={item.pin.image_url}
                orgName={item.pin.organization?.name ?? 'Independent'}
                orgLogoUrl={item.pin.organization?.logo_url}
                isConfirmed={item.pin.org_claimed_at != null}
                onPress={() => router.push(`/pins/${item.pin_id}`)}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}
