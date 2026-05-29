import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Search, Plus } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { PinCard } from '@/components/ui/pin-card'
import { OrgBadge } from '@/components/ui/org-badge'
import { UserRow } from '@/components/ui/user-row'
import { TabBar } from '@/components/ui/tab-bar'
import { Colors, Spacing } from '@/constants/theme'
import type { Organization, PinWithOrg, ProfileSnap } from '@/types'

type Tab = 'pins' | 'orgs' | 'users'
type ProfileRow = ProfileSnap

const TABS: { key: Tab; label: string }[] = [
  { key: 'pins', label: 'Pins' },
  { key: 'orgs', label: 'Organizations' },
  { key: 'users', label: 'Users' },
]

const TAB_BAR_BOTTOM_OFFSET = 84 // floating nav height + padding

export default function ExploreScreen() {
  const { session } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pins')
  const [query, setQuery] = useState('')
  const [pins, setPins] = useState<PinWithOrg[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [users, setUsers] = useState<ProfileRow[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const myId = session!.user.id
    const [pinsRes, orgsRes, usersRes, followsRes] = await Promise.all([
      supabase.from('pins').select('*, organization:organizations(*)').order('created_at', { ascending: false }),
      supabase.from('organizations').select('*').order('name'),
      supabase.from('profiles').select('id, username, avatar_url').neq('id', myId).order('username'),
      supabase.from('follows').select('following_id').eq('follower_id', myId),
    ])
    if (pinsRes.data) setPins(pinsRes.data as PinWithOrg[])
    if (orgsRes.data) setOrgs(orgsRes.data)
    if (usersRes.data) setUsers(usersRes.data)
    if (followsRes.data) setFollowingIds(new Set(followsRes.data.map(f => f.following_id)))
    setLoading(false)
    setRefreshing(false)
  }, [session])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  const toggleFollow = async (userId: string) => {
    const myId = session!.user.id
    if (followingIds.has(userId)) {
      await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', userId)
      setFollowingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    } else {
      await supabase.from('follows').insert({ follower_id: myId, following_id: userId })
      setFollowingIds(prev => new Set([...prev, userId]))
    }
  }

  const q = query.trim().toLowerCase()
  const filteredPins = q ? pins.filter(p => p.name.toLowerCase().includes(q)) : pins
  const filteredOrgs = q ? orgs.filter(o => o.name.toLowerCase().includes(q)) : orgs
  const filteredUsers = q ? users.filter(u => u.username.toLowerCase().includes(q)) : users

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-off-white">
        <ActivityIndicator />
      </View>
    )
  }

  const placeholder = tab === 'pins' ? 'Search pins...' : tab === 'orgs' ? 'Search organizations...' : 'Search users...'

  return (
    <View className="flex-1 bg-off-white">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row justify-between items-center mb-[14px]">
          <Text className="font-monda-bold text-[28px] text-deep-black">Explore</Text>
          {tab === 'pins' && (
            <TouchableOpacity
              onPress={() => router.push('/pins/new')}
              className="flex-row items-center gap-1.5 bg-deep-black px-3.5 py-2 rounded-btn"
            >
              <Plus size={15} color="white" strokeWidth={2.5} />
              <Text className="font-monda-bold text-[13px] text-white">New pin</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View className="flex-row items-center bg-gray-100 rounded-btn px-3 mb-3 gap-2">
          <Search size={16} color={Colors.dark.muted} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            placeholderTextColor={Colors.dark.muted}
            className="flex-1 font-monda text-sm text-deep-black py-[10px]"
          />
        </View>

        {/* Tab chips */}
        <TabBar
          tabs={TABS}
          active={tab}
          onChange={(key) => { setTab(key); setQuery('') }}
        />
      </View>

      {/* Pins grid */}
      {tab === 'pins' && (
        <FlatList
          data={filteredPins}
          numColumns={3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={p => p.id}
          keyboardShouldPersistTaps="handled"
          columnWrapperStyle={{ gap: Spacing.gridGap, paddingHorizontal: Spacing.screenPad }}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: TAB_BAR_BOTTOM_OFFSET + 16, gap: 16 }}
          ListEmptyComponent={
            <Text className="font-monda text-gray-500 text-center mt-10">
              No pins found.
            </Text>
          }
          renderItem={({ item }) => (
            <View className="flex-1">
              <PinCard
                id={item.id}
                name={item.name}
                imageUrl={item.image_url}
                orgColor={item.organization?.color}
                orgLogoUrl={item.organization?.logo_url}
                isConfirmed={item.organization_id != null}
                onPress={() => router.push(`/pins/${item.id}`)}
              />
            </View>
          )}
        />
      )}

      {/* Orgs list */}
      {tab === 'orgs' && (
        <FlatList
          data={filteredOrgs}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={o => o.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: TAB_BAR_BOTTOM_OFFSET + 16, gap: 10 }}
          ListEmptyComponent={
            <Text className="font-monda text-gray-500 text-center mt-10">
              No organizations found.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/orgs/${item.id}`)}
              className="flex-row items-center gap-3 bg-white rounded-card p-3.5"
            >
              <OrgBadge name={item.name} logoUrl={item.logo_url} size={40} />
              <Text className="font-monda-bold text-[15px] text-deep-black flex-1">
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Users list */}
      {tab === 'users' && (
        <FlatList
          data={filteredUsers}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={u => u.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: TAB_BAR_BOTTOM_OFFSET + 16, gap: 10 }}
          ListEmptyComponent={
            <Text className="font-monda text-gray-500 text-center mt-10">
              No users found.
            </Text>
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
      )}
    </View>
  )
}
