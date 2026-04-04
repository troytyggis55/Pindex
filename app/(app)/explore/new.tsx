import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function NewPinScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editionSize, setEditionSize] = useState('')
  const [releasedAt, setReleasedAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!name.trim()) { Alert.alert('Missing name', 'A pin must have a name.'); return }
    setSubmitting(true)

    const payload: Record<string, unknown> = {
      name: name.trim(),
      organization_id: null,
    }
    if (description.trim()) payload.description = description.trim()
    if (editionSize.trim()) {
      const n = parseInt(editionSize, 10)
      if (isNaN(n) || n < 1) { Alert.alert('Invalid edition size', 'Enter a positive number.'); setSubmitting(false); return }
      payload.edition_size = n
    }
    if (releasedAt.trim()) payload.released_at = releasedAt.trim()

    const { data, error } = await supabase.from('pins').insert(payload).select('id').single()
    if (error || !data) {
      Alert.alert('Error', error?.message ?? 'Could not create pin')
      setSubmitting(false)
      return
    }

    router.replace(`/(app)/explore/${data.id}`)
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24 }}>New Pin</Text>

      <Text style={{ fontWeight: '600', marginBottom: 6 }}>Name *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Pin name"
        autoFocus
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 16 }}
      />

      <Text style={{ fontWeight: '600', marginBottom: 6 }}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Optional description"
        multiline
        numberOfLines={3}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 16, textAlignVertical: 'top' }}
      />

      <Text style={{ fontWeight: '600', marginBottom: 6 }}>Edition size</Text>
      <TextInput
        value={editionSize}
        onChangeText={setEditionSize}
        placeholder="e.g. 100"
        keyboardType="numeric"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 16 }}
      />

      <Text style={{ fontWeight: '600', marginBottom: 6 }}>Release date</Text>
      <TextInput
        value={releasedAt}
        onChangeText={setReleasedAt}
        placeholder="YYYY-MM-DD"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 24 }}
      />

      <TouchableOpacity
        onPress={submit}
        disabled={submitting}
        style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Create pin</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}
