import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'

// expo-router gives params as string | string[]; email arrives flat.
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default function ResetPasswordScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const email = str(params.email) ?? ''

  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Start the reset from the previous screen so we know which account to update.')
      return
    }
    if (code.trim().length !== 8) {
      Alert.alert('Invalid code', 'Enter the 6-digit code from your email.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Too short', 'Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.')
      return
    }

    setLoading(true)

    // The 6-digit code both proves ownership of the email and creates the
    // session needed to set a new password — no deep link, no URL parsing.
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'recovery',
    })
    if (verifyError) {
      setLoading(false)
      Alert.alert('Invalid code', 'That code is incorrect or has expired. Request a new one.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setLoading(false)
      Alert.alert('Error', updateError.message)
      return
    }

    await supabase.auth.signOut()
    setLoading(false)
    Alert.alert('Password updated', 'You can now sign in with your new password.', [
      { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
    ])
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Pindex</Text>
      <Text style={{ fontSize: 18 }}>Choose a new password</Text>
      <Text style={{ color: '#555' }}>
        Enter the 6-digit code sent to {email || 'your email'} and your new password.
      </Text>

      <TextInput
        placeholder="8-digit code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={8}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
      />
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
        onPress={submit}
        disabled={loading}
        style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff' }}>{loading ? 'Updating…' : 'Reset password'}</Text>
      </TouchableOpacity>
    </View>
  )
}
