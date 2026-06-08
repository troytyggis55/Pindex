import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const sendReset = async () => {
    const trimmed = email.trim()
    if (!trimmed) return
    setLoading(true)
    // Sends a recovery email containing a 6-digit code (no deep link). The
    // code is verified on the reset-password screen via verifyOtp.
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed)
    setLoading(false)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    router.push({ pathname: '/reset-password', params: { email: trimmed } })
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Pindex</Text>
      <Text style={{ fontSize: 18 }}>Reset password</Text>
      <Text style={{ color: '#555' }}>
        Enter your email and we'll send you a 6-digit code to reset your password.
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
      />

      <TouchableOpacity
        onPress={sendReset}
        disabled={loading}
        style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff' }}>{loading ? 'Sending...' : 'Send reset code'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login">
        <Text style={{ textAlign: 'center', color: '#555' }}>Back to sign in</Text>
      </Link>
    </View>
  )
}
