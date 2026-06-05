import { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { InfiniteList } from '@/components/infinite-list'
import { UserCard } from '@/components/ui/user-card'
import { Spacing } from '@/constants/theme'
import type { FollowingUser } from '@/types'

export function CollectionFollowingTab() {
  const router = useRouter()
  const { session } = useAuth()
  const myId = session!.user.id
  const [unfollowedIds, setUnfollowedIds] = useState<Set<string>>(new Set())

  const buildQuery = useCallback(
    (sb: typeof supabase) =>
      sb.from('follows')
        .select('id:following_id, profile:profiles!following_id(id, username, avatar_url)')
        .eq('follower_id', myId),
    [myId]
  )

  const toggleFollow = async (userId: string) => {
    if (unfollowedIds.has(userId)) {
      await supabase.from('follows').insert({ follower_id: myId, following_id: userId })
      setUnfollowedIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    } else {
      await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', userId)
      setUnfollowedIds(prev => new Set([...prev, userId]))
    }
  }

  return (
    <InfiniteList<FollowingUser>
      buildQuery={buildQuery}
      emptyText="Not following anyone yet."
      contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: Spacing.navOffset + 16, gap: 10 }}
      renderItem={({ item }) => (
        <UserCard
          id={item.id}
          username={item.profile.username}
          avatarUrl={item.profile.avatar_url}
          onPress={() => router.push(`/users/${item.id}`)}
          isFollowing={!unfollowedIds.has(item.id)}
          onFollowToggle={() => toggleFollow(item.id)}
        />
      )}
    />
  )
}
