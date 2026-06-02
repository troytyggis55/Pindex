import { useCallback, useMemo, useState } from 'react'
import { Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { UserRow } from '@/components/ui/user-row'
import { Spacing } from '@/constants/theme'
import type { ProfileSnap } from '@/types'

export interface ExploreUsersTabProps {
  query: string
}

export function ExploreUsersTab({ query }: ExploreUsersTabProps) {
  const router = useRouter()
  const { session } = useAuth()
  const myId = session!.user.id
  const [users, setUsers] = useState<ProfileSnap[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [usersRes, followsRes] = await Promise.all([
      supabase.from('profiles').select('id, username, avatar_url').neq('id', myId).order('username'),
      supabase.from('follows').select('following_id').eq('follower_id', myId),
    ])
    if (usersRes.data) setUsers(usersRes.data)
    if (followsRes.data) setFollowingIds(new Set(followsRes.data.map(f => f.following_id)))
    setLoading(false)
    setRefreshing(false)
  }, [myId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  const toggleFollow = async (userId: string) => {
    if (followingIds.has(userId)) {
      await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', userId)
      setFollowingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    } else {
      await supabase.from('follows').insert({ follower_id: myId, following_id: userId })
      setFollowingIds(prev => new Set([...prev, userId]))
    }
  }

  const q = query.trim().toLowerCase()
  const data = useMemo(() => (q ? users.filter(u => u.username.toLowerCase().includes(q)) : users), [users, q])

  return (
    <FlatList
      data={data}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyExtractor={u => u.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: Spacing.navOffset + 16, gap: 10 }}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator className="mt-10" />
        ) : (
          <Text className="font-monda text-gray-500 text-center mt-10">No users found.</Text>
        )
      }
      renderItem={({ item }) => (
        <UserRow
          id={item.id}
          username={item.username}
          avatarUrl={item.avatar_url}
          onPress={() => router.push(`/users/${item.id}`)}
          isFollowing={followingIds.has(item.id)}
          onFollowToggle={() => toggleFollow(item.id)}
        />
      )}
    />
  )
}
