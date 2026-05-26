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
import { Colors } from '@/constants/theme'
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

  return (
    <View className="flex-1 bg-off-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <ScreenHeader
        title="Profile"
        onBack={() => router.back()}
        className="px-4 pt-4"
      />

      <View className="px-4 pt-6 gap-6">
        {/* Avatar */}
        <View className="items-center gap-3">
          <TouchableOpacity onPress={handleAvatarUpload} disabled={uploadingAvatar} activeOpacity={0.8}>
            <View className="relative">
              <Avatar url={profile?.avatar_url} username={username} size={80} />
              <View
                className="absolute bottom-0 right-0 w-[26px] h-[26px] rounded-full bg-off-white border-gray-200 items-center justify-center"
                style={{ borderWidth: 1.5 }}
              >
                {uploadingAvatar
                  ? <ActivityIndicator size="small" color={Colors.deepBlack} />
                  : <Camera size={13} color={Colors.deepBlack} strokeWidth={2} />
                }
              </View>
            </View>
          </TouchableOpacity>
          <Text className="font-monda-bold text-lg text-deep-black">@{username}</Text>
        </View>

        {hasCreatedPins && (
          <TouchableOpacity
            onPress={() => router.push('/admin/created-pins')}
            className="flex-row items-center bg-white rounded-btn px-3.5 py-2.5 mb-3.5 gap-2"
          >
            <Pencil size={16} color={Colors.dark.muted} strokeWidth={2} />
            <Text className="font-monda-bold text-[15px] text-deep-black flex-1">
              Pins I've created
            </Text>
            <ChevronRight size={14} color={Colors.dark.muted} strokeWidth={2} />
          </TouchableOpacity>
        )}

        {/* Admin orgs */}
        {loadingOrgs ? (
          <ActivityIndicator />
        ) : adminOrgs.length > 0 ? (
          <View className="gap-2">
            <Text
              className="font-monda-bold text-[13px] text-gray-500"
              style={{ letterSpacing: 0.5 }}
            >
              MY ORGANIZATIONS
            </Text>
            {adminOrgs.map(org => (
              <TouchableOpacity
                key={org.id}
                onPress={() => router.push(`/admin/${org.id}`)}
                className="bg-white rounded-card p-3.5 flex-row items-center gap-3"
              >
                <OrgBadge name={org.name} logoUrl={org.logo_url} size={36} />
                <Text className="font-monda-bold text-[15px] text-deep-black flex-1">
                  {org.name}
                </Text>
                <ChevronRight size={16} color={Colors.dark.muted} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Actions */}
        <View className="gap-2.5 mt-2">
          <TouchableOpacity
            onPress={handleSignOut}
            className="border border-gray-300 rounded-btn p-3.5 items-center"
          >
            <Text className="font-monda-bold text-sm text-gray-500">Log out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="rounded-btn p-3.5 items-center bg-red-100"
          >
            <Text className="font-monda-bold text-sm text-red-600">Delete account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
