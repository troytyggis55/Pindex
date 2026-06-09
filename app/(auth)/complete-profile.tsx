import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Camera } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { pickAndUpload } from '@/lib/upload'
import { Avatar } from '@/components/ui/avatar'
import { Colors } from '@/constants/theme'

export default function CompleteProfileScreen() {
  const { session, signOut, refreshProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loading, setLoading] = useState(false)

  // Profile picture is optional. Upload immediately on pick — the profile row
  // already exists (created by the new-user trigger), so we update it in place.
  const handleAvatarUpload = async () => {
    if (!session?.user) return
    setUploadingAvatar(true)
    try {
      const url = await pickAndUpload({
        bucket: 'profile-images',
        path: `${session.user.id}.jpg`,
        width: 400,
        quality: 0.85,
      })
      if (!url) return
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', session.user.id)
      if (error) Alert.alert('Error', error.message)
      else setAvatarUrl(url)
    } catch (e: unknown) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setUploadingAvatar(false)
    }
  }

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

        {/* Optional profile picture */}
        <View className="items-center gap-2 mb-2">
          <TouchableOpacity onPress={handleAvatarUpload} disabled={uploadingAvatar} activeOpacity={0.8}>
            <View className="relative">
              <Avatar url={avatarUrl} username={username.trim() || '?'} size={88} />
              <View
                className="absolute bottom-0 right-0 w-[28px] h-[28px] rounded-full bg-off-white border-gray-200 items-center justify-center"
                style={{ borderWidth: 1.5 }}
              >
                {uploadingAvatar
                  ? <ActivityIndicator size="small" color={Colors.deepBlack} />
                  : <Camera size={14} color={Colors.deepBlack} strokeWidth={2} />
                }
              </View>
            </View>
          </TouchableOpacity>
          <Text className="font-monda text-sm text-gray-500">Add a photo (optional)</Text>
        </View>

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
