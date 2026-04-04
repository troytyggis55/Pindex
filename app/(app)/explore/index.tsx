import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { Pin, Organization } from '@/types'

type Tab = 'pins' | 'orgs' | 'users'
type PinWithOrg = Pin & { organization: Organization | null }
type ProfileRow = { id: string; username: string }

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

  useFocusEffect(useCallback(() => {
    const myId = session!.user.id
    Promise.all([
      supabase.from('pins').select('*, organization:organizations(*)').order('created_at', { ascending: false }),
      supabase.from('organizations').select('*').order('name'),
      supabase.from('profiles').select('id, username').neq('id', myId).order('username'),
      supabase.from('follows').select('following_id').eq('follower_id', myId),
    ]).then(([pinsRes, orgsRes, usersRes, followsRes]) => {
      if (pinsRes.data) setPins(pinsRes.data as PinWithOrg[])
      if (orgsRes.data) setOrgs(orgsRes.data)
      if (usersRes.data) setUsers(usersRes.data)
      if (followsRes.data) setFollowingIds(new Set(followsRes.data.map(f => f.following_id)))
      setLoading(false)
    })
  }, []))

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
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Explore</Text>
        {tab === 'pins' && (
          <TouchableOpacity
            onPress={() => router.push('/(app)/explore/new')}
            style={{ backgroundColor: '#000', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>+ New Pin</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {(['pins', 'orgs', 'users'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => { setTab(t); setQuery('') }}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
              backgroundColor: tab === t ? '#000' : '#f0f0f0',
            }}
          >
            <Text style={{ color: tab === t ? '#fff' : '#555', fontWeight: '600', fontSize: 13 }}>
              {t === 'pins' ? 'Pins' : t === 'orgs' ? 'Organizations' : 'Users'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={`Search ${tab === 'pins' ? 'pins' : tab === 'orgs' ? 'organizations' : 'users'}...`}
        style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, marginBottom: 12 }}
      />

      {tab === 'pins' && (
        <FlatList
          data={filteredPins}
          keyExtractor={p => p.id}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No pins found.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/explore/${item.id}`)}
              style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: '#555', fontSize: 13 }}>{item.organization?.name ?? 'Independent'}</Text>
              {item.description ? (
                <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }} numberOfLines={1}>{item.description}</Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}

      {tab === 'orgs' && (
        <FlatList
          data={filteredOrgs}
          keyExtractor={o => o.id}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No organizations found.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/orgs/${item.id}`)}
              style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12 }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {tab === 'users' && (
        <FlatList
          data={filteredUsers}
          keyExtractor={u => u.id}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No users found.</Text>}
          renderItem={({ item }) => {
            const isFollowing = followingIds.has(item.id)
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, gap: 8 }}>
                <TouchableOpacity onPress={() => router.push(`/(app)/users/${item.id}`)} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600' }}>@{item.username}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleFollow(item.id)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
                    backgroundColor: isFollowing ? '#f0f0f0' : '#000',
                  }}
                >
                  <Text style={{ color: isFollowing ? '#555' : '#fff', fontWeight: '600', fontSize: 13 }}>
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
