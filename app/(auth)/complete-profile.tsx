import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'

export default function CompleteProfileScreen() {
  const { session, refreshProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const createProfile = async () => {
    if (!username.trim() || !session?.user) return
    setLoading(true)
    const { error } = await supabase.from('profiles').insert({
      id: session.user.id,
      username: username.trim(),
    })
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      await refreshProfile()
    }
    setLoading(false)
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Choose a username</Text>
      <Text style={{ color: '#555' }}>This is how other users will find you.</Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
      />

      <TouchableOpacity
        onPress={createProfile}
        disabled={loading || !username.trim()}
        style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff' }}>{loading ? 'Saving...' : 'Continue'}</Text>
      </TouchableOpacity>
    </View>
  )
}
