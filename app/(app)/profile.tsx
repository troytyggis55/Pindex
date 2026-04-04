import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'

export default function ProfileScreen() {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

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
