import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Camera, Pencil, ChevronRight } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { pickAndUpload } from '@/lib/upload'
import { OrgBadge } from '@/components/ui/org-badge'
import { Avatar } from '@/components/ui/avatar'
import { ScreenHeader } from '@/components/ui/screen-header'
import { Colors, Radius, Spacing } from '@/constants/theme'
import type { Organization } from '@/types'

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [adminOrgs, setAdminOrgs] = useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [hasCreatedPins, setHasCreatedPins] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!profile) return
    setLoadingOrgs(true)
    Promise.all([
      supabase.from('organizations').select('*').eq('admin_user_id', profile.id).order('name'),
      supabase.from('pins').select('id', { count: 'exact', head: true }).eq('created_by', profile.id),
    ]).then(([orgsResult, pinsResult]) => {
      setAdminOrgs(orgsResult.data ?? [])
      setHasCreatedPins((pinsResult.count ?? 0) > 0)
      setLoadingOrgs(false)
    })
  }, [profile]))

  const handleAvatarUpload = async () => {
    if (!profile) return
    setUploadingAvatar(true)
    try {
      const url = await pickAndUpload({
        bucket: 'profile-images',
        path: `${profile.id}.jpg`,
        width: 400,
        quality: 0.85,
      })
      if (!url) return
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', profile.id)
      if (error) Alert.alert('Error', error.message)
      else await refreshProfile()
    } catch (e: unknown) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_own_account')
            if (error) Alert.alert('Error', error.message)
            else await signOut()
          },
        },
      ]
    )
  }

  const username = profile?.username ?? '?'
  const initial = username.charAt(0).toUpperCase()

  return (
    <View style={{ flex: 1, backgroundColor: Colors.offWhite, paddingTop: insets.top }}>
      {/* Header */}
      <ScreenHeader
        title="Profile"
        onBack={() => router.back()}
        className="px-4 pt-4"
      />

      <View style={{ paddingHorizontal: Spacing.screenPad, paddingTop: 24, gap: 24 }}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={handleAvatarUpload} disabled={uploadingAvatar} activeOpacity={0.8}>
            <View style={{ position: 'relative' }}>
              <Avatar url={profile?.avatar_url} username={username} size={80} />
              <View style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: 13,
                backgroundColor: Colors.offWhite,
                borderWidth: 1.5, borderColor: '#e0e0de',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {uploadingAvatar
                  ? <ActivityIndicator size="small" color={Colors.deepBlack} />
                  : <Camera size={13} color={Colors.deepBlack} strokeWidth={2} />
                }
              </View>
            </View>
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 18, color: Colors.deepBlack }}>@{username}</Text>
        </View>

        {hasCreatedPins && <TouchableOpacity
            onPress={() => router.push('/admin/created-pins')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: Radius.btn,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 14,
              gap: 8,
            }}
        >

          <Pencil size={16} color={Colors.dark.muted} strokeWidth={2} />
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack, flex: 1 }}>
            Pins I've created
          </Text>
          <ChevronRight size={14} color={Colors.dark.muted} strokeWidth={2} />
        </TouchableOpacity>}

        {/* Admin orgs */}
        {loadingOrgs ? (
          <ActivityIndicator />
        ) : adminOrgs.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.dark.muted, letterSpacing: 0.5 }}>
              MY ORGANIZATIONS
            </Text>
            {adminOrgs.map(org => (
              <TouchableOpacity
                key={org.id}
                onPress={() => router.push(`/admin/${org.id}`)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: Radius.card,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <OrgBadge name={org.name} logoUrl={org.logo_url} size={36} />
                <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: Colors.deepBlack, flex: 1 }}>
                  {org.name}
                </Text>
                <ChevronRight size={16} color={Colors.dark.muted} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}




        {/* Actions */}
        <View style={{ gap: 10, marginTop: 8 }}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              borderWidth: 1,
              borderColor: '#d0d0ce',
              borderRadius: Radius.btn,
              padding: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.dark.muted }}>Log out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={{
              borderRadius: Radius.btn,
              padding: 14,
              alignItems: 'center',
              backgroundColor: '#fee2e2',
            }}
          >
            <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: '#dc2626' }}>Delete account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
