import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/theme'

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
    <KeyboardAwareScrollView
      className="flex-1 bg-off-white"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={72}
    >
      <View className="flex-1 justify-center px-6 gap-3">
        <Text className="font-monda-bold text-3xl text-deep-black">Pindex</Text>
        <Text className="font-monda text-lg text-deep-black">Choose a new password</Text>
        <Text className="font-monda text-gray-500 mb-2">
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
          placeholderTextColor={Colors.light.muted}
          className="border border-gray-300 rounded-btn px-4 py-3 font-monda text-base text-deep-black bg-white"
        />
        <TextInput
          placeholder="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholderTextColor={Colors.light.muted}
          className="border border-gray-300 rounded-btn px-4 py-3 font-monda text-base text-deep-black bg-white"
        />
        <TextInput
          placeholder="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
          placeholderTextColor={Colors.light.muted}
          className="border border-gray-300 rounded-btn px-4 py-3 font-monda text-base text-deep-black bg-white"
        />

        <TouchableOpacity
          onPress={submit}
          disabled={loading}
          className="bg-deep-black rounded-btn py-4 items-center mt-1"
        >
          <Text className="font-monda-bold text-off-white">
            {loading ? 'Updating…' : 'Reset password'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  )
}
