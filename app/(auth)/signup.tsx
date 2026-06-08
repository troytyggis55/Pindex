import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Link } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/theme'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const signUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      Alert.alert('Sign up failed', error.message)
    } else {
      Alert.alert('Check your email', 'A confirmation link has been sent to ' + email)
    }
    setLoading(false)
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-off-white"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={72}
    >
      <View className="flex-1 justify-center px-6 gap-3">
        <Text className="font-monda-bold text-3xl text-deep-black">Pindex</Text>
        <Text className="font-monda text-lg text-deep-black mb-2">Create account</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholderTextColor={Colors.light.muted}
          className="border border-gray-300 rounded-btn px-4 py-3 font-monda text-base text-deep-black bg-white"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholderTextColor={Colors.light.muted}
          className="border border-gray-300 rounded-btn px-4 py-3 font-monda text-base text-deep-black bg-white"
        />

        <TouchableOpacity
          onPress={signUp}
          disabled={loading}
          className="bg-deep-black rounded-btn py-4 items-center mt-1"
        >
          <Text className="font-monda-bold text-off-white">
            {loading ? 'Creating account...' : 'Create account'}
          </Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" className="mt-2">
          <Text className="text-center font-monda text-gray-500">
            Already have an account? Sign in
          </Text>
        </Link>
      </View>
    </KeyboardAwareScrollView>
  )
}
