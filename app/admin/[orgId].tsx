import { useCallback, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { Organization, Pin } from '@/types'

export default function OrgAdminScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { profile } = useAuth()

  const [org, setOrg] = useState<Organization | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [orgName, setOrgName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [transferUsername, setTransferUsername] = useState('')
  const [transferCandidate, setTransferCandidate] = useState<{ id: string; username: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [transferring, setTransferring] = useState(false)

  const load = useCallback(async () => {
    if (!orgId) return
    const [orgRes, pinsRes] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      supabase.from('pins').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }),
    ])
    if (orgRes.data) {
      setOrg(orgRes.data)
      setOrgName(orgRes.data.name)
    }
    if (pinsRes.data) setPins(pinsRes.data)
    setLoading(false)
    setRefreshing(false)
  }, [orgId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  const saveName = async () => {
    const trimmed = orgName.trim()
    if (!trimmed) { Alert.alert('Missing name', 'Organization name cannot be empty.'); return }
    if (trimmed === org?.name) return
    setSavingName(true)
    const { error } = await supabase.from('organizations').update({ name: trimmed }).eq('id', orgId)
    setSavingName(false)
    if (error) { Alert.alert('Error', error.message); return }
    setOrg(prev => prev ? { ...prev, name: trimmed } : prev)
  }

  const findTransferUser = async () => {
    const username = transferUsername.trim()
    if (!username) return
    if (username === profile?.username) {
      Alert.alert('Invalid', 'You cannot transfer admin to yourself.')
      return
    }
    setSearching(true)
    setTransferCandidate(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .single()
    setSearching(false)
    if (error || !data) {
      Alert.alert('Not found', `No user found with username "${username}".`)
      return
    }
    setTransferCandidate(data)
  }

  const confirmTransfer = () => {
    if (!transferCandidate) return
    Alert.alert(
      'Transfer admin',
      `Transfer admin of "${org?.name}" to @${transferCandidate.username}? You will lose admin access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: async () => {
            setTransferring(true)
            const { error } = await supabase
              .from('organizations')
              .update({ admin_user_id: transferCandidate.id })
              .eq('id', orgId)
            setTransferring(false)
            if (error) { Alert.alert('Error', error.message); return }
            router.back()
          },
        },
      ]
    )
  }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>
  }

  if (!org) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Organization not found.</Text></View>
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Manage organization</Text>

      {/* Edit name */}
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>Organization name</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
        <TextInput
          value={orgName}
          onChangeText={setOrgName}
          style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}
        />
        <TouchableOpacity
          onPress={saveName}
          disabled={savingName || orgName.trim() === org.name}
          style={{
            backgroundColor: orgName.trim() === org.name ? '#ccc' : '#000',
            borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center',
          }}
        >
          {savingName
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
        </TouchableOpacity>
      </View>

      {/* Pins */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>Pins ({pins.length})</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/admin/new-pin', params: { orgId, orgName: org.name } })}
          style={{ backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>+ Add pin</Text>
        </TouchableOpacity>
      </View>

      {pins.length === 0 ? (
        <Text style={{ color: '#888', marginBottom: 32 }}>No pins yet.</Text>
      ) : (
        <View style={{ marginBottom: 32 }}>
          {pins.map(pin => (
            <TouchableOpacity
              key={pin.id}
              onPress={() => router.push(`/(app)/explore/${pin.id}`)}
              style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 8 }}
            >
              <Text style={{ fontWeight: '600', fontSize: 15 }}>{pin.name}</Text>
              {pin.description ? (
                <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }} numberOfLines={2}>{pin.description}</Text>
              ) : null}
              {pin.edition_size ? (
                <Text style={{ color: '#555', fontSize: 12, marginTop: 4 }}>Edition of {pin.edition_size}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Transfer admin */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Transfer admin</Text>
        <Text style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
          Hand over admin of this organization to another Pindex user. You will lose access.
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TextInput
            value={transferUsername}
            onChangeText={text => { setTransferUsername(text); setTransferCandidate(null) }}
            placeholder="Username"
            autoCapitalize="none"
            style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}
          />
          <TouchableOpacity
            onPress={findTransferUser}
            disabled={searching || !transferUsername.trim()}
            style={{
              backgroundColor: !transferUsername.trim() ? '#ccc' : '#000',
              borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center',
            }}
          >
            {searching
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '600' }}>Find</Text>}
          </TouchableOpacity>
        </View>

        {transferCandidate && (
          <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontWeight: '600' }}>@{transferCandidate.username}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={confirmTransfer}
          disabled={!transferCandidate || transferring}
          style={{
            borderWidth: 1, borderColor: !transferCandidate ? '#ccc' : '#dc2626',
            borderRadius: 8, padding: 14, alignItems: 'center',
          }}
        >
          {transferring
            ? <ActivityIndicator color="#dc2626" />
            : <Text style={{ color: !transferCandidate ? '#ccc' : '#dc2626', fontWeight: '600' }}>Transfer admin</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
