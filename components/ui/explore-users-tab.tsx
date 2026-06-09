import { useCallback, useState } from 'react'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { InfiniteList } from '@/components/infinite-list'
import { UserCard } from '@/components/ui/user-card'
import { Spacing } from '@/constants/theme'
import type { ProfileSnap } from '@/types'

export interface ExploreUsersTabProps {
  query: string
}

export function ExploreUsersTab({ query }: ExploreUsersTabProps) {
  const router = useRouter()
  const { session } = useAuth()
  const myId = session!.user.id
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const q = query.trim()

  const loadFollows = useCallback(async () => {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', myId)
    if (data) setFollowingIds(new Set(data.map(f => f.following_id)))
  }, [myId])

  useFocusEffect(useCallback(() => { loadFollows() }, [loadFollows]))

  const buildQuery = useCallback(
    (sb: typeof supabase) => {
      let base = sb
        .from('profiles')
        .select('id, username, avatar_url')
        .neq('id', myId)
        .not('username', 'is', null)
      if (q) base = base.ilike('username', `%${q}%`)
      return base.order('username')
    },
    [myId, q]
  )

  const toggleFollow = async (userId: string) => {
    if (followingIds.has(userId)) {
      await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', userId)
      setFollowingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    } else {
      await supabase.from('follows').insert({ follower_id: myId, following_id: userId })
      setFollowingIds(prev => new Set([...prev, userId]))
    }
  }

  return (
    <InfiniteList<ProfileSnap>
      buildQuery={buildQuery}
      emptyText="No users found."
      contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: Spacing.navOffset + 16, gap: 10 }}
      renderItem={({ item }) => (
        <UserCard
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
