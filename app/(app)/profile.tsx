import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { Organization } from '@/types'

export default function ProfileScreen() {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [adminOrgs, setAdminOrgs] = useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!profile) return
    setLoadingOrgs(true)
    supabase
      .from('organizations')
      .select('*')
      .eq('admin_user_id', profile.id)
      .order('name')
      .then(({ data }) => {
        setAdminOrgs(data ?? [])
        setLoadingOrgs(false)
      })
  }, [profile]))

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
            if (error) {
              Alert.alert('Error', error.message)
            } else {
              await signOut()
            }
          },
        },
      ]
    )
  }

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: insets.top + 24 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>Profile</Text>
      <Text style={{ fontSize: 17, color: '#333', marginBottom: 32 }}>@{profile?.username}</Text>

      {/* Admin organizations */}
      {loadingOrgs ? (
        <ActivityIndicator style={{ marginBottom: 32 }} />
      ) : adminOrgs.length > 0 ? (
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
            My organizations
          </Text>
          {adminOrgs.map(org => (
            <TouchableOpacity
              key={org.id}
              onPress={() => router.push(`/(app)/admin/${org.id}`)}
              style={{
                borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
                padding: 14, marginBottom: 8, flexDirection: 'row',
                justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <Text style={{ fontWeight: '600', fontSize: 15 }}>{org.name}</Text>
              <Text style={{ color: '#888' }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        onPress={handleSignOut}
        style={{ borderWidth: 1, borderColor: '#dc2626', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 }}
      >
        <Text style={{ color: '#dc2626', fontWeight: '600' }}>Log out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleDeleteAccount}
        style={{ borderRadius: 8, padding: 14, alignItems: 'center', backgroundColor: '#dc2626' }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Delete account</Text>
      </TouchableOpacity>
    </View>
  )
}
