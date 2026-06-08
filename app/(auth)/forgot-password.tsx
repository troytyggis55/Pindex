import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Link, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/theme'

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
    <KeyboardAwareScrollView
      className="flex-1 bg-off-white"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={72}
    >
      <View className="flex-1 justify-center px-6 gap-3">
        <Text className="font-monda-bold text-3xl text-deep-black">Pindex</Text>
        <Text className="font-monda text-lg text-deep-black">Reset password</Text>
        <Text className="font-monda text-gray-500 mb-2">
          Enter your email and we&apos;ll send you a 6-digit code to reset your password.
        </Text>

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

        <TouchableOpacity
          onPress={sendReset}
          disabled={loading}
          className="bg-deep-black rounded-btn py-4 items-center mt-1"
        >
          <Text className="font-monda-bold text-off-white">
            {loading ? 'Sending...' : 'Send reset code'}
          </Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" className="mt-2">
          <Text className="text-center font-monda text-gray-500">Back to sign in</Text>
        </Link>
      </View>
    </KeyboardAwareScrollView>
  )
}
