import { useCallback, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { ScrollView } from "react-native-gesture-handler"
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Camera } from 'lucide-react-native'
import ColorPicker, { Panel1, HueSlider, Preview } from 'reanimated-color-picker'
import { supabase } from '@/lib/supabase'
import { pickAndUpload } from '@/lib/upload'
import { useAuth } from '@/context/auth'
import { OrgBadge } from '@/components/ui/org-badge'
import { PinCard } from '@/components/ui/pin-card'
import { Colors, Radius, Spacing } from '@/constants/theme'
import type { Organization, Pin } from '@/types'

type PendingClaim = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  created_at: string
  creator: { username: string } | null
}

export default function OrgAdminScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { profile } = useAuth()

  const [org, setOrg] = useState<Organization | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [orgName, setOrgName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string>(Colors.orgFallback)
  const [savingColor, setSavingColor] = useState(false)

  const [transferUsername, setTransferUsername] = useState('')
  const [transferCandidate, setTransferCandidate] = useState<{ id: string; username: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [transferring, setTransferring] = useState(false)

  const load = useCallback(async () => {
    if (!orgId) return
    const [orgRes, pinsRes, claimsRes] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      // Only show pins that have been claimed by this org
      supabase
        .from('pins')
        .select('*')
        .eq('organization_id', orgId)
        .not('org_claimed_at', 'is', null)
        .order('created_at', { ascending: false }),
      // Pins assigned to this org but not yet claimed
      supabase
        .from('pins')
        .select('id, name, description, image_url, created_at, creator:profiles!created_by(username)')
        .eq('organization_id', orgId)
        .is('org_claimed_at', null)
        .order('created_at', { ascending: false }),
    ])
    if (orgRes.data) {
      setOrg(orgRes.data)
      setOrgName(orgRes.data.name)
      setSelectedColor(orgRes.data.color ?? Colors.orgFallback)
    }
    if (pinsRes.data) setPins(pinsRes.data)
    if (claimsRes.data) setPendingClaims(claimsRes.data as PendingClaim[])
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

  const saveColor = async (hex: string) => {
    setSavingColor(true)
    const { error } = await supabase.from('organizations').update({ color: hex }).eq('id', orgId)
    setSavingColor(false)
    if (error) Alert.alert('Error', error.message)
    else setOrg(prev => prev ? { ...prev, color: hex } : prev)
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

  const claimPin = async (pinId: string) => {
    setClaiming(pinId)
    const { error } = await supabase.rpc('claim_pin_for_org', { p_pin_id: pinId })
    setClaiming(null)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    // Refresh to move pin from pending → claimed list
    load()
  }

  const deletePin = (pin: PendingClaim) => {
    Alert.alert(
      'Delete pin',
      `Are you sure you want to delete the "${pin.name}" pin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeleting(pin.id)
            const { error } = await supabase.from('pins').delete().eq('id', pin.id)
            setDeleting(null)
            if (error) { Alert.alert('Error', error.message); return }
            setPendingClaims(prev => prev.filter(p => p.id !== pin.id))
          },
        },
      ]
    )
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

      {/* Brand color */}
      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>
        Brand color
      </Text>
      <View style={{ marginBottom: 32 }}>
        <ColorPicker
          value={selectedColor}
          onChangeJS={({ hex }) => setSelectedColor(hex)}
          onCompleteJS={({ hex }) => saveColor(hex)}
        >
          <Preview style={{ marginBottom: 12, borderRadius: Radius.btn }} />
          <Panel1 style={{ marginBottom: 12, borderRadius: Radius.card }} />
          <HueSlider style={{ borderRadius: Radius.btn }} />
        </ColorPicker>
        {savingColor && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <ActivityIndicator size="small" color={Colors.dark.muted} />
            <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 12, color: Colors.dark.muted }}>Saving…</Text>
          </View>
        )}
      </View>

      {/* Pending Claims */}
      {pendingClaims.length > 0 && (
        <View style={{ marginBottom: 32 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
          }}>
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: Colors.yellow,
            }} />
            <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack }}>
              Pending Claims ({pendingClaims.length})
            </Text>
          </View>
          <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 13, color: Colors.dark.muted, marginBottom: 12 }}>
            These pins were created by users and assigned to your organization. Claim them to take ownership.
          </Text>
          <View style={{ gap: 8 }}>
            {pendingClaims.map(pin => (
              <View
                key={pin.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 30,
                  backgroundColor: '#fff',
                  borderRadius: Radius.card,
                  padding: 14,
                  borderWidth: 1.5,
                  borderColor: '#f0e090',
                }}
              >
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => router.push(`/pins/${pin.id}`)}>
                    <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack }}>{pin.name}</Text>
                    {pin.description ? (
                      <Text style={{ fontFamily: 'Monda_400Regular', color: Colors.dark.muted, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                        {pin.description}
                      </Text>
                    ) : null}
                    <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 11, color: Colors.dark.muted, marginTop: 6 }}>
                      {pin.creator ? `Added by @${pin.creator.username}` : 'Added by a user'} · {new Date(pin.created_at).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <TouchableOpacity
                      onPress={() => claimPin(pin.id)}
                      disabled={claiming === pin.id || deleting === pin.id}
                      style={{
                        flex: 1,
                        backgroundColor: Colors.deepBlack,
                        borderRadius: Radius.btn,
                        paddingVertical: 8,
                        alignItems: 'center',
                      }}
                    >
                      {claiming === pin.id
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: '#fff' }}>Claim</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deletePin(pin)}
                      disabled={claiming === pin.id || deleting === pin.id}
                      style={{
                        borderWidth: 1,
                        borderColor: '#dc2626',
                        borderRadius: Radius.btn,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        alignItems: 'center',
                      }}
                    >
                      {deleting === pin.id
                        ? <ActivityIndicator color="#dc2626" size="small" />
                        : <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: '#dc2626' }}>Delete</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
                <PinCard
                  id={pin.id}
                  name={pin.name}
                  imageUrl={pin.image_url}
                  orgColor={org.color}
                  orgLogoUrl={org.logo_url}
                  isConfirmed={false}
                  onPress={() => router.push(`/pins/${pin.id}`)}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Claimed Pins */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack }}>
          Pins ({pins.length})
        </Text>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/pins/new',
            params: { orgId, orgName: org.name },
          })}
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.gridGap, marginBottom: 32 }}>
          {pins.map(pin => (
            <View key={pin.id} style={{ width: '31%' }}>
              <PinCard
                id={pin.id}
                name={pin.name}
                imageUrl={pin.image_url}
                orgColor={org.color}
                orgLogoUrl={org.logo_url}
                isConfirmed={true}
                onPress={() => router.push(`/pins/${pin.id}`)}
              />
            </View>
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
