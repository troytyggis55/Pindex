import { useCallback, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Camera } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { pickAndUpload } from '@/lib/upload'
import { useAuth } from '@/context/auth'
import { OrgBadge } from '@/components/ui/org-badge'
import { Colors, Radius, Spacing } from '@/constants/theme'
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
  const [uploadingLogo, setUploadingLogo] = useState(false)

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

  const handleLogoUpload = async () => {
    if (!orgId) return
    setUploadingLogo(true)
    try {
      const url = await pickAndUpload({
        bucket: 'org-logos',
        path: `${orgId}.jpg`,
        width: 400,
        quality: 0.85,
      })
      if (!url) return
      const { error } = await supabase.from('organizations').update({ logo_url: url }).eq('id', orgId)
      if (error) Alert.alert('Error', error.message)
      else setOrg(prev => prev ? { ...prev, logo_url: url } : prev)
    } catch (e: unknown) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setUploadingLogo(false)
    }
  }

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
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}><ActivityIndicator /></View>
  }

  if (!org) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}><Text style={{ fontFamily: 'Monda_400Regular' }}>Organization not found.</Text></View>
  }

  const nameChanged = orgName.trim() !== org.name

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.offWhite }}
      contentContainerStyle={{ padding: Spacing.screenPad, paddingTop: insets.top + 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        <ChevronLeft size={20} color={Colors.deepBlack} strokeWidth={2} />
        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack }}>Back</Text>
      </TouchableOpacity>

      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 24, color: Colors.deepBlack, marginBottom: 24 }}>
        Manage organization
      </Text>

      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 28 }}>
        <TouchableOpacity onPress={handleLogoUpload} disabled={uploadingLogo} activeOpacity={0.8}>
          <View style={{ position: 'relative' }}>
            <OrgBadge name={org.name} logoUrl={org.logo_url} size={72} />
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 24, height: 24, borderRadius: 12,
              backgroundColor: Colors.deepBlack,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {uploadingLogo
                ? <ActivityIndicator size="small" color="#fff" />
                : <Camera size={12} color="#fff" strokeWidth={2} />
              }
            </View>
          </View>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 12, color: Colors.dark.muted, marginTop: 8 }}>
          Tap to update logo
        </Text>
      </View>

      {/* Edit name */}
      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>
        Organization name
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
        <TextInput
          value={orgName}
          onChangeText={setOrgName}
          placeholderTextColor={Colors.dark.muted}
          style={{
            flex: 1,
            fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
            borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
            padding: 12, backgroundColor: '#fff',
          }}
        />
        <TouchableOpacity
          onPress={saveName}
          disabled={savingName || !nameChanged}
          style={{
            backgroundColor: nameChanged ? Colors.deepBlack : '#e0e0de',
            borderRadius: Radius.btn, paddingHorizontal: 16, justifyContent: 'center',
          }}
        >
          {savingName
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: nameChanged ? '#fff' : Colors.dark.muted }}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Pins */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack }}>
          Pins ({pins.length})
        </Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/admin/new-pin', params: { orgId, orgName: org.name } })}
          style={{
            backgroundColor: Colors.deepBlack,
            borderRadius: Radius.btn, paddingHorizontal: 14, paddingVertical: 8,
          }}
        >
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: '#fff' }}>+ Add pin</Text>
        </TouchableOpacity>
      </View>

      {pins.length === 0 ? (
        <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, marginBottom: 32 }}>No pins yet.</Text>
      ) : (
        <View style={{ marginBottom: 32, gap: 8 }}>
          {pins.map(pin => (
            <TouchableOpacity
              key={pin.id}
              onPress={() => router.push(`/(app)/explore/${pin.id}`)}
              style={{
                backgroundColor: '#fff',
                borderRadius: Radius.card,
                padding: 14,
              }}
            >
              <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack }}>{pin.name}</Text>
              {pin.description ? (
                <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                  {pin.description}
                </Text>
              ) : null}
              {pin.edition_size ? (
                <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, fontSize: 12, marginTop: 4 }}>
                  Edition of {pin.edition_size}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Transfer admin */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#e8e8e6', paddingTop: 24 }}>
        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack, marginBottom: 4 }}>
          Transfer admin
        </Text>
        <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, fontSize: 13, marginBottom: 16 }}>
          Hand over admin of this organization to another Pindex user. You will lose access.
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TextInput
            value={transferUsername}
            onChangeText={text => { setTransferUsername(text); setTransferCandidate(null) }}
            placeholder="Username"
            placeholderTextColor={Colors.dark.muted}
            autoCapitalize="none"
            style={{
              flex: 1,
              fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
              borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
              padding: 12, backgroundColor: '#fff',
            }}
          />
          <TouchableOpacity
            onPress={findTransferUser}
            disabled={searching || !transferUsername.trim()}
            style={{
              backgroundColor: transferUsername.trim() ? Colors.deepBlack : '#e0e0de',
              borderRadius: Radius.btn, paddingHorizontal: 16, justifyContent: 'center',
            }}
          >
            {searching
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: transferUsername.trim() ? '#fff' : Colors.dark.muted }}>Find</Text>
            }
          </TouchableOpacity>
        </View>

        {transferCandidate && (
          <View style={{
            backgroundColor: '#fff', borderRadius: Radius.card, padding: 12, marginBottom: 12,
          }}>
            <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack }}>
              @{transferCandidate.username}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={confirmTransfer}
          disabled={!transferCandidate || transferring}
          style={{
            borderWidth: 1,
            borderColor: transferCandidate ? '#dc2626' : '#d0d0ce',
            borderRadius: Radius.btn, padding: 14, alignItems: 'center',
          }}
        >
          {transferring
            ? <ActivityIndicator color="#dc2626" />
            : <Text style={{
                fontFamily: 'Monda_700Bold', fontSize: 14,
                color: transferCandidate ? '#dc2626' : Colors.dark.muted,
              }}>
                Transfer admin
              </Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
