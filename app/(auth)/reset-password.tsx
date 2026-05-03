import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const applyTokens = async (url: string | null) => {
      if (!url) return
      const fragment = url.split('#')[1]
      if (!fragment) return
      const params = new URLSearchParams(fragment)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const type = params.get('type')
      if (access_token && refresh_token && type === 'recovery') {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) {
          Alert.alert('Link expired', 'This password reset link has expired. Please request a new one.')
        } else {
          setReady(true)
        }
      }
    }

    Linking.getInitialURL().then(applyTokens)
    const sub = Linking.addEventListener('url', ({ url }) => applyTokens(url))
    return () => sub.remove()
  }, [])

  // Fallback: auth state change fires PASSWORD_RECOVERY when tokens are valid
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const updatePassword = async () => {
    if (password.length < 6) {
      Alert.alert('Too short', 'Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      await supabase.auth.signOut()
      Alert.alert('Password updated', 'You can now sign in with your new password.', [
        { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
      ])
    }
    setLoading(false)
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Pindex</Text>
        <Text style={{ color: '#555' }}>Verifying reset link…</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Pindex</Text>
      <Text style={{ fontSize: 18 }}>Choose a new password</Text>

      <TextInput
        placeholder="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
      />

      <TouchableOpacity
        onPress={updatePassword}
        disabled={loading}
        style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff' }}>{loading ? 'Updating…' : 'Update password'}</Text>
      </TouchableOpacity>
    </View>
  )
}
