import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { PinCard } from '@/components/ui/pin-card'
import { Avatar } from '@/components/ui/avatar'
import { ScreenHeader } from '@/components/ui/screen-header'
import { Colors, Spacing } from '@/constants/theme'
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
    return (
      <View className="flex-1 justify-center items-center bg-off-white">
        <ActivityIndicator />
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

      <View className="items-center mb-5">
        <Avatar url={avatarUrl} username={username} size={72} />
      </View>

      <View className="flex-row justify-between items-center mb-7">
        <Text className="font-monda-bold text-[24px] text-deep-black">@{username}</Text>
        <TouchableOpacity
          onPress={toggleFollow}
          disabled={followLoading}
          className={`px-4 py-2 rounded-btn border ${isFollowing ? 'border-gray-300 bg-transparent' : 'border-deep-black bg-deep-black'}`}
        >
          {followLoading
            ? <ActivityIndicator color={isFollowing ? Colors.dark.muted : 'white'} size="small" />
            : <Text className={`font-monda-bold text-[13px] ${isFollowing ? 'text-gray-500' : 'text-white'}`}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      <Text className="font-monda-bold text-[15px] text-deep-black mb-4">
        Open to trading ({wantToTradePins.length})
      </Text>

      {wantToTradePins.length === 0 ? (
        <Text className="font-monda text-gray-500">No pins listed for trading.</Text>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {wantToTradePins.map(item => (
            <View key={item.id} className="w-[31%]">
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
