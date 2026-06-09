import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { Colors } from '@/constants/theme'

export default function CompleteProfileScreen() {
  const { session, signOut, refreshProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const saveUsername = async () => {
    const trimmed = username.trim()
    if (!trimmed || !session?.user) return
    setLoading(true)
    // The new-user trigger already inserted this profile row with a null
    // username, so we update it rather than insert. A 23505 unique violation
    // means the name is taken.
    const { error } = await supabase
      .from('profiles')
      .update({ username: trimmed })
      .eq('id', session.user.id)
    if (error) {
      Alert.alert(
        error.code === '23505' ? 'Username taken' : 'Error',
        error.code === '23505' ? 'That username is already in use. Try another.' : error.message,
      )
      setLoading(false)
      return
    }
    await refreshProfile()
    // On success the root guard flips `authed` true and navigates into the app;
    // no manual navigation needed. Leave `loading` set so the button stays
    // disabled through the transition.
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-off-white"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={72}
    >
      <View className="flex-1 justify-center px-6 gap-3">
        <Text className="font-monda-bold text-3xl text-deep-black">Choose a username</Text>
        <Text className="font-monda text-base text-gray-500 mb-2">
          This is how other users will find you.
        </Text>

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          placeholderTextColor={Colors.light.muted}
          className="border border-gray-300 rounded-btn px-4 py-3 font-monda text-base text-deep-black bg-white"
        />

        <TouchableOpacity
          onPress={saveUsername}
          disabled={loading || !username.trim()}
          className="bg-deep-black rounded-btn py-4 items-center mt-1"
        >
          <Text className="font-monda-bold text-off-white">
            {loading ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={signOut} className="mt-2">
          <Text className="text-center font-monda text-gray-500">Not you? Sign out</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  )
}
