import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, Camera } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { pickImageUri, uploadImageUri } from '@/lib/upload'
import { Colors, Radius, Spacing } from '@/constants/theme'

export default function OrgNewPinScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { orgId, orgName } = useLocalSearchParams<{ orgId: string; orgName: string }>()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editionSize, setEditionSize] = useState('')
  const [releasedAt, setReleasedAt] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const pickImage = async () => {
    try {
      const uri = await pickImageUri()
      if (uri) setImageUri(uri)
    } catch {
      Alert.alert('Error', 'Could not open image library.')
    }
  }

  const submit = async () => {
    if (!name.trim()) { Alert.alert('Missing name', 'A pin must have a name.'); return }
    setSubmitting(true)

    const n = editionSize.trim() ? parseInt(editionSize, 10) : null
    if (n !== null && (isNaN(n) || n < 1)) {
      Alert.alert('Invalid edition size', 'Enter a positive number.')
      setSubmitting(false)
      return
    }

    const { data, error } = await supabase.from('pins').insert({
      name: name.trim(),
      organization_id: orgId,
      description: description.trim() || null,
      edition_size: n,
      released_at: releasedAt.trim() || null,
    }).select('id').single()

    if (error || !data) {
      Alert.alert('Error', error?.message ?? 'Could not create pin')
      setSubmitting(false)
      return
    }

    if (imageUri) {
      try {
        const url = await uploadImageUri(imageUri, {
          bucket: 'pin-images',
          path: `${data.id}.jpg`,
          width: 400,
          quality: 0.8,
        })
        await supabase.from('pins').update({ image_url: url }).eq('id', data.id)
      } catch {
        // Image upload failing should not block pin creation
      }
    }

    router.back()
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.offWhite }}
      contentContainerStyle={{ padding: Spacing.screenPad, paddingTop: insets.top + 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        <ChevronLeft size={20} color={Colors.deepBlack} strokeWidth={2} />
        <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: Colors.deepBlack }}>Back</Text>
      </TouchableOpacity>

      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 24, color: Colors.deepBlack, marginBottom: 4 }}>New Pin</Text>
      {orgName ? (
        <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.dark.muted, marginBottom: 24 }}>{orgName}</Text>
      ) : (
        <View style={{ marginBottom: 24 }} />
      )}

      {/* Image picker */}
      <TouchableOpacity
        onPress={pickImage}
        activeOpacity={0.8}
        style={{ alignSelf: 'center', marginBottom: 28, position: 'relative' }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: 100, height: 100, borderRadius: 50 }} />
        ) : (
          <View style={{
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: '#f0f0ee',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: '#d0d0ce', borderStyle: 'dashed',
          }}>
            <Camera size={28} color={Colors.dark.muted} strokeWidth={1.5} />
          </View>
        )}
        <View style={{
          position: 'absolute', bottom: 2, right: 2,
          width: 28, height: 28, borderRadius: 14,
          backgroundColor: Colors.deepBlack,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Camera size={14} color="#fff" strokeWidth={2} />
        </View>
      </TouchableOpacity>

      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>Name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Pin name"
        placeholderTextColor={Colors.dark.muted}
        autoFocus
        style={{
          fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
          borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
          padding: 12, marginBottom: 16, backgroundColor: '#fff',
        }}
      />

      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Optional description"
        placeholderTextColor={Colors.dark.muted}
        multiline
        numberOfLines={3}
        style={{
          fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
          borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
          padding: 12, marginBottom: 16, textAlignVertical: 'top', backgroundColor: '#fff',
        }}
      />

      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>Edition size</Text>
      <TextInput
        value={editionSize}
        onChangeText={setEditionSize}
        placeholder="e.g. 100"
        placeholderTextColor={Colors.dark.muted}
        keyboardType="numeric"
        style={{
          fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
          borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
          padding: 12, marginBottom: 16, backgroundColor: '#fff',
        }}
      />

      <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.deepBlack, marginBottom: 6 }}>Release date</Text>
      <TextInput
        value={releasedAt}
        onChangeText={setReleasedAt}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={Colors.dark.muted}
        style={{
          fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack,
          borderWidth: 1, borderColor: '#d0d0ce', borderRadius: Radius.btn,
          padding: 12, marginBottom: 28, backgroundColor: '#fff',
        }}
      />

      <TouchableOpacity
        onPress={submit}
        disabled={submitting}
        style={{ backgroundColor: Colors.deepBlack, padding: 14, borderRadius: Radius.btn, alignItems: 'center' }}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: '#fff' }}>Create pin</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}
