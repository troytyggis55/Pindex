import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/theme'

// expo-router gives params as string | string[]; params arrive flat.
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default function EnterCodeScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const email = str(params.email) ?? ''
  // 'recovery' (forgot-password) or 'signup' (email confirmation). Defaults to
  // recovery so existing reset deep links/params keep working.
  const flow = str(params.type) === 'signup' ? 'signup' : 'recovery'

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Start over from the previous screen so we know which account to verify.')
      return
    }
    if (code.trim().length < 6) {
      Alert.alert('Invalid code', 'Enter the code from your email.')
      return
    }

    setLoading(true)

    // Verifying the code both proves ownership of the email and creates a
    // session. For recovery that session lets us set a new password; for signup
    // it confirms the account and logs the user in.
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: flow,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Invalid code', 'That code is incorrect or has expired. Request a new one.')
      return
    }

    // replace, not push: the session is established, so there's nothing to
    // return to on the code screen. For signup the new session has no username
    // yet, so the auth guards route on to complete-profile; for recovery we go
    // set the new password.
    router.replace(flow === 'signup' ? '/(auth)/complete-profile' : '/reset-password')
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
        <Text className="font-monda text-lg text-deep-black">Enter your code</Text>
        <Text className="font-monda text-gray-500 mb-2">
          Enter the code sent to {email || 'your email'}.
        </Text>

        <TextInput
          placeholder="Code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={8}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          placeholderTextColor={Colors.light.muted}
          className="border border-gray-300 rounded-btn px-4 py-3 font-monda text-base text-deep-black bg-white"
        />

        <TouchableOpacity
          onPress={verify}
          disabled={loading}
          className="bg-deep-black rounded-btn py-4 items-center mt-1"
        >
          <Text className="font-monda-bold text-off-white">
            {loading ? 'Verifying…' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  )
}
