import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { Link } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const signInWithEmail = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert('Sign in failed', error.message)
    setLoading(false)
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Pindex</Text>
      <Text style={{ fontSize: 18 }}>Sign in</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className='border border-gray-500 p-3 rounded-lg color-black'
        placeholderTextColor='gray'
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className='border border-gray-500 p-3 rounded-lg color-black'
        placeholderTextColor='gray'
      />

      <TouchableOpacity
        onPress={signInWithEmail}
        disabled={loading}
        style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff' }}>{loading ? 'Signing in...' : 'Sign in'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/forgot-password">
        <Text style={{ textAlign: 'center', color: '#555' }}>Forgot password?</Text>
      </Link>

      <Link href="/(auth)/signup">
        <Text style={{ textAlign: 'center', color: '#555' }}>
          Don&apos;t have an account? Sign up
        </Text>
      </Link>
    </View>
  )
}
