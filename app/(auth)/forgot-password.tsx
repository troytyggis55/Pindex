import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { Link } from 'expo-router'
import * as Linking from 'expo-linking'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const sendReset = async () => {
    if (!email.trim()) return
    setLoading(true)
    const redirectTo = Linking.createURL('reset-password')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Pindex</Text>
        <Text style={{ fontSize: 18 }}>Check your email</Text>
        <Text style={{ color: '#555' }}>
          A password reset link has been sent to {email}. Tap it to choose a new password.
        </Text>
        <Link href="/(auth)/login">
          <Text style={{ textAlign: 'center', color: '#555' }}>Back to sign in</Text>
        </Link>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Pindex</Text>
      <Text style={{ fontSize: 18 }}>Reset password</Text>
      <Text style={{ color: '#555' }}>
        Enter your email and we'll send you a link to reset your password.
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
        <Text style={{ color: '#fff' }}>{loading ? 'Sending...' : 'Send reset link'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login">
        <Text style={{ textAlign: 'center', color: '#555' }}>Back to sign in</Text>
      </Link>
    </View>
  )
}
