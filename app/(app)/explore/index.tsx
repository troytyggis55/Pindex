import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Search, Plus } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { PinCard } from '@/components/ui/pin-card'
import { OrgBadge } from '@/components/ui/org-badge'
import { Colors, Radius, Spacing } from '@/constants/theme'
import type { Pin, Organization } from '@/types'

type Tab = 'pins' | 'orgs' | 'users'
type PinWithOrg = Pin & { organization: Organization | null }
type ProfileRow = { id: string; username: string }

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
      supabase.from('profiles').select('id, username').neq('id', myId).order('username'),
      supabase.from('follows').select('following_id').eq('follower_id', myId),
    ])
    if (pinsRes.data) setPins(pinsRes.data as PinWithOrg[])
    if (orgsRes.data) setOrgs(orgsRes.data)
    if (usersRes.data) setUsers(usersRes.data)
    if (followsRes.data) setFollowingIds(new Set(followsRes.data.map(f => f.following_id)))
    setLoading(false)
    setRefreshing(false)
  }, [])

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
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}><ActivityIndicator /></View>
  }

  const placeholder = tab === 'pins' ? 'Search pins...' : tab === 'orgs' ? 'Search organizations...' : 'Search users...'

  return (
    <View style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      {/* Header */}
      <View style={{ paddingHorizontal: Spacing.screenPad, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 28, color: Colors.deepBlack }}>Explore</Text>
          {tab === 'pins' && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/explore/new')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: Colors.deepBlack,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: Radius.btn,
              }}
            >
              <Plus size={15} color="#fff" strokeWidth={2.5} />
              <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: '#fff' }}>New pin</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f0f0ee',
          borderRadius: Radius.btn,
          paddingHorizontal: 12,
          marginBottom: 12,
          gap: 8,
        }}>
          <Search size={16} color={Colors.dark.muted} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            placeholderTextColor={Colors.dark.muted}
            style={{ flex: 1, fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack, paddingVertical: 10 }}
          />
        </View>

        {/* Tab chips */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TABS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => { setTab(key); setQuery('') }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: Radius.btn,
                backgroundColor: tab === key ? Colors.deepBlack : 'transparent',
                borderWidth: 1,
                borderColor: tab === key ? Colors.deepBlack : '#d0d0ce',
              }}
            >
              <Text style={{
                fontFamily: 'Monda_700Bold',
                fontSize: 13,
                color: tab === key ? '#fff' : Colors.dark.muted,
              }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pins grid */}
      {tab === 'pins' && (
        <FlatList
          data={filteredPins}
          numColumns={2}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          keyExtractor={p => p.id}
          keyboardShouldPersistTaps="handled"
          columnWrapperStyle={{ gap: Spacing.gridGap, paddingHorizontal: Spacing.screenPad }}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: TAB_BAR_BOTTOM_OFFSET + 16, gap: 20 }}
          ListEmptyComponent={
            <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }}>
              No pins found.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <PinCard
                id={item.id}
                name={item.name}
                imageUrl={item.image_url}
                orgName={item.organization?.name ?? 'Independent'}
                orgLogoUrl={item.organization?.logo_url}
                isConfirmed={item.organization_id != null}
                onPress={() => router.push(`/(app)/explore/${item.id}`)}
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
            <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }}>
              No organizations found.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/orgs/${item.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#fff',
                borderRadius: Radius.card,
                padding: 14,
              }}
            >
              <OrgBadge name={item.name} logoUrl={item.logo_url} size={40} />
              <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack, flex: 1 }}>
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
            <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, textAlign: 'center', marginTop: 40 }}>
              No users found.
            </Text>
          }
          renderItem={({ item }) => {
            const isFollowing = followingIds.has(item.id)
            return (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderRadius: Radius.card,
                padding: 12,
                gap: 12,
              }}>
                {/* Avatar */}
                <TouchableOpacity onPress={() => router.push(`/users/${item.id}`)}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: Colors.deepBlack,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 16, color: '#fff' }}>
                      {item.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push(`/users/${item.id}`)} style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack }}>
                    @{item.username}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => toggleFollow(item.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: Radius.btn,
                    backgroundColor: isFollowing ? 'transparent' : Colors.deepBlack,
                    borderWidth: 1,
                    borderColor: isFollowing ? '#d0d0ce' : Colors.deepBlack,
                  }}
                >
                  <Text style={{
                    fontFamily: 'Monda_700Bold',
                    fontSize: 12,
                    color: isFollowing ? Colors.dark.muted : '#fff',
                  }}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}
