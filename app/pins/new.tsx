import { useCallback, useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { ChevronLeft, Camera, Building2, X, Trash2 } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { pickImageUri, uploadImageUri } from '@/lib/upload'
import { Colors, Radius, Spacing } from '@/constants/theme'

type OrgResult = { id: string; name: string }

export default function NewPinScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useAuth()

  // Params: orgId+orgName for pre-filled org (from org admin flow)
  //         pinId for edit mode
  const {
    orgId: orgIdParam,
    orgName: orgNameParam,
    pinId: editPinId,
  } = useLocalSearchParams<{ orgId?: string; orgName?: string; pinId?: string }>()

  const isEditMode = !!editPinId

  const [loadingPin, setLoadingPin] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editionSize, setEditionSize] = useState('')
  const [releasedAt, setReleasedAt] = useState('')
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [imageUri, setImageUri] = useState<string | null>(null)

  // Org assignment (create mode only)
  const [orgQuery, setOrgQuery] = useState('')
  const [orgResults, setOrgResults] = useState<OrgResult[]>([])
  const [selectedOrg, setSelectedOrg] = useState<OrgResult | null>(
    orgIdParam && orgNameParam ? { id: orgIdParam, name: orgNameParam } : null
  )
  const [orgNotOnPindex, setOrgNotOnPindex] = useState(false)
  const [editOrgClaimed, setEditOrgClaimed] = useState(false)

  const isOrgPrefilled = !!orgIdParam

  // Load existing pin in edit mode
  const loadPin = useCallback(async () => {
    if (!editPinId || !session?.user) return
    const { data, error } = await supabase
      .from('pins')
      .select('id, name, description, edition_size, released_at, image_url, created_by, org_claimed_at, organization_id, organization:organizations(id, name, admin_user_id)')
      .eq('id', editPinId)
      .single()

    if (error || !data) {
      Alert.alert('Error', 'Pin not found.')
      router.back()
      return
    }
    const org = data.organization as { id: string; name: string; admin_user_id: string | null } | null
    const isCreatorUnclaimed = data.created_by === session.user.id && data.org_claimed_at === null
    const isOrgAdmin = data.org_claimed_at !== null && org?.admin_user_id === session.user.id
    if (!isCreatorUnclaimed && !isOrgAdmin) {
      Alert.alert('Not editable', 'You do not have permission to edit this pin.')
      router.back()
      return
    }

    setEditOrgClaimed(data.org_claimed_at !== null)
    if (org) setSelectedOrg({ id: org.id, name: org.name })
    setName(data.name)
    setDescription(data.description ?? '')
    setEditionSize(data.edition_size ? String(data.edition_size) : '')
    setReleasedAt(data.released_at ? data.released_at.slice(0, 10) : '')
    setExistingImageUrl(data.image_url)
    setLoadingPin(false)
  }, [editPinId, session?.user.id])

  useFocusEffect(useCallback(() => {
    if (isEditMode) loadPin()
  }, [isEditMode, loadPin]))

  // Debounced org search (create mode only, no org selected yet)
  useEffect(() => {
    if ((isEditMode && editOrgClaimed) || isOrgPrefilled || selectedOrg || !orgQuery.trim()) {
      setOrgResults([])
      return
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', `%${orgQuery.trim()}%`)
        .limit(6)
      setOrgResults(data ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [orgQuery, isEditMode, editOrgClaimed, isOrgPrefilled, selectedOrg])

  const confirmDeletePin = () => {
    Alert.alert(
      'Delete pin',
      `Are you sure you want to delete the "${name}" pin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('pins').delete().eq('id', editPinId!)
            if (error) { Alert.alert('Error', error.message); return }
            router.back()
          },
        },
      ]
    )
  }

  const pickImage = async () => {
    try {
      const uri = await pickImageUri()
      if (uri) setImageUri(uri)
    } catch {
      Alert.alert('Error', 'Could not open image library.')
    }
  }

  const submit = async () => {
    if (!name.trim()) { Alert.alert('Missing name', 'A pin must have a name.'); return }
    if (!session?.user) { Alert.alert('Error', 'Not signed in.'); return }
    setSubmitting(true)

    const n = editionSize.trim() ? parseInt(editionSize, 10) : null
    if (n !== null && (isNaN(n) || n < 1)) {
      Alert.alert('Invalid edition size', 'Enter a positive number.')
      setSubmitting(false)
      return
    }

    if (isEditMode) {
      // Update existing pin
      const updates: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        edition_size: n,
        released_at: releasedAt.trim() || null,
      }
      if (!editOrgClaimed) {
        updates.organization_id = selectedOrg?.id ?? null
      }
      if (imageUri) {
        try {
          const url = await uploadImageUri(imageUri, {
            bucket: 'pin-images',
            path: `${editPinId}.jpg`,
            width: 400,
            quality: 0.8,
          })
          updates.image_url = url
        } catch {
          // non-blocking
        }
      }
      const { error } = await supabase.from('pins').update(updates).eq('id', editPinId)
      setSubmitting(false)
      if (error) { Alert.alert('Error', error.message); return }
      router.back()
    } else {
      // Create new pin — auto-claim if user is admin of the selected org
      let autoClaim: string | null = null
      if (selectedOrg) {
        const { data: orgAdmin } = await supabase
          .from('organizations')
          .select('id')
          .eq('id', selectedOrg.id)
          .eq('admin_user_id', session.user.id)
          .maybeSingle()
        if (orgAdmin) autoClaim = new Date().toISOString()
      }

      const { data, error } = await supabase.from('pins').insert({
        name: name.trim(),
        organization_id: selectedOrg?.id ?? null,
        created_by: session.user.id,
        org_claimed_at: autoClaim,
        description: description.trim() || null,
        edition_size: n,
        released_at: releasedAt.trim() || null,
      }).select('id').single()

      if (error || !data) {
        Alert.alert('Error', error?.message ?? 'Could not create pin')
        setSubmitting(false)
        return
      }

      if (imageUri) {
        try {
          const url = await uploadImageUri(imageUri, {
            bucket: 'pin-images',
            path: `${data.id}.jpg`,
            width: 400,
            quality: 0.8,
          })
          await supabase.from('pins').update({ image_url: url }).eq('id', data.id)
        } catch {
          // non-blocking
        }
      }

      router.replace(`/pins/${data.id}`)
    }
  }

  if (loadingPin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite }}>
        <ActivityIndicator />
      </View>
    )
  }

  const displayImage = imageUri ?? existingImageUrl

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.offWhite }}
      contentContainerStyle={{ padding: Spacing.screenPad, paddingTop: insets.top + 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 }}>
          <ChevronLeft size={20} color={Colors.deepBlack} strokeWidth={2} />
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 24, color: Colors.deepBlack, marginBottom: 24 }}>
          {isEditMode ? 'Edit Pin' : 'New Pin'}
        </Text>

        {/* Image picker */}
        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.8}
          style={{ alignSelf: 'center', marginBottom: 28, position: 'relative' }}
        >
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : (
            <View style={{
              width: 100, height: 100, borderRadius: 50,
              backgroundColor: '#f0f0ee',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: '#d0d0ce', borderStyle: 'dashed',
            }}>
              <Camera size={28} color={Colors.dark.muted} strokeWidth={1.5} />
            </View>
          )}
          <View style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: Colors.deepBlack,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={14} color="#fff" strokeWidth={2} />
          </View>
        </TouchableOpacity>

        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>Name *</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Pin name"
          placeholderTextColor={Colors.dark.muted}
          autoFocus={!isEditMode}
          style={{
            fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
            borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
            padding: 12, marginBottom: 16, backgroundColor: '#fff',
          }}
        />

        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional description"
          placeholderTextColor={Colors.dark.muted}
          multiline
          numberOfLines={3}
          style={{
            fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
            borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
            padding: 12, marginBottom: 16, textAlignVertical: 'top', backgroundColor: '#fff',
          }}
        />

        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>Edition size</Text>
        <TextInput
          value={editionSize}
          onChangeText={setEditionSize}
          placeholder="e.g. 100"
          placeholderTextColor={Colors.dark.muted}
          keyboardType="numeric"
          style={{
            fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
            borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
            padding: 12, marginBottom: 16, backgroundColor: '#fff',
          }}
        />

        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>Release date</Text>
        <TextInput
          value={releasedAt}
          onChangeText={setReleasedAt}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.dark.muted}
          style={{
            fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
            borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
            padding: 12, marginBottom: 24, backgroundColor: '#fff',
          }}
        />

        {/* Organization — create mode + edit mode for unclaimed creator */}
        {(!isEditMode || (isEditMode && !editOrgClaimed)) && (
          <>
            <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>Organization</Text>

            {isOrgPrefilled ? (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: '#f0f0ee', borderRadius: Radius.btn,
                borderWidth: 1, borderColor: '#d0d0ce',
                padding: 12, marginBottom: 28,
              }}>
                <Building2 size={16} color={Colors.dark.muted} strokeWidth={2} />
                <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack, flex: 1 }}>
                  {selectedOrg?.name}
                </Text>
              </View>
            ) : selectedOrg ? (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: '#fff', borderRadius: Radius.btn,
                borderWidth: 1.5, borderColor: Colors.blue,
                padding: 12, marginBottom: 28,
              }}>
                <Building2 size={16} color={Colors.blue} strokeWidth={2} />
                <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack, flex: 1 }}>
                  {selectedOrg.name}
                </Text>
                <TouchableOpacity onPress={() => { setSelectedOrg(null); setOrgQuery('') }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={16} color={Colors.dark.muted} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginBottom: 28 }}>
                <TextInput
                  value={orgQuery}
                  onChangeText={text => { setOrgQuery(text); if (orgNotOnPindex) setOrgNotOnPindex(false) }}
                  placeholder="Search organizations…"
                  placeholderTextColor={Colors.dark.muted}
                  editable={!orgNotOnPindex}
                  style={{
                    fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
                    borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
                    padding: 12, marginBottom: 8,
                    backgroundColor: orgNotOnPindex ? '#f0f0ee' : '#fff',
                  }}
                />

                {!orgNotOnPindex && orgResults.length > 0 && (
                  <View style={{
                    backgroundColor: '#fff', borderRadius: Radius.card,
                    borderWidth: 1, borderColor: '#e8e8e6',
                    marginBottom: 10, overflow: 'hidden',
                  }}>
                    {orgResults.map((org, i) => (
                      <TouchableOpacity
                        key={org.id}
                        onPress={() => { setSelectedOrg(org); setOrgQuery(''); setOrgResults([]) }}
                        style={{
                          padding: 12,
                          borderBottomWidth: i < orgResults.length - 1 ? 1 : 0,
                          borderBottomColor: '#f0f0ee',
                        }}
                      >
                        <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack }}>{org.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => {
                    const next = !orgNotOnPindex
                    setOrgNotOnPindex(next)
                    if (next) { setOrgQuery(''); setOrgResults([]) }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
                >
                  <View style={{
                    width: 18, height: 18, borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: orgNotOnPindex ? Colors.deepBlack : '#d0d0ce',
                    backgroundColor: orgNotOnPindex ? Colors.deepBlack : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {orgNotOnPindex && (
                      <Text style={{ color: '#fff', fontSize: 11, lineHeight: 14 }}>✓</Text>
                    )}
                  </View>
                  <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 13, color: Colors.dark.muted }}>
                    My org is not on Pindex
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Delete — edit mode for claimed pins (org admin) */}
        {isEditMode && editOrgClaimed && (
          <>
            <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>Organization</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: '#f0f0ee', borderRadius: Radius.btn,
              borderWidth: 1, borderColor: '#d0d0ce',
              paddingVertical: 12, paddingLeft: 12, paddingRight: 8,
              marginBottom: 28,
            }}>
              <Building2 size={16} color={Colors.dark.muted} strokeWidth={2} />
              <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack, flex: 1 }}>
                {selectedOrg?.name ?? 'Unknown'}
              </Text>
              <TouchableOpacity onPress={confirmDeletePin} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Trash2 size={18} color="#ef4444" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={submit}
          disabled={submitting}
          style={{ backgroundColor: Colors.deepBlack, padding: 14, borderRadius: Radius.btn, alignItems: 'center' }}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: '#fff' }}>
                {isEditMode ? 'Save changes' : 'Create pin'}
              </Text>
          }
        </TouchableOpacity>
    </ScrollView>
  )
}
