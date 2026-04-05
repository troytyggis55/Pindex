import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import type { Pin } from '@/types'

type PinOption = Pick<Pin, 'id' | 'name'>
type Partner =
  | { type: 'profile'; id: string; name: string }
  | { type: 'contact'; name: string }
type ProfileResult = { id: string; username: string }

function PinSearchSection({
  label,
  isActive,
  query,
  collectionMatches,
  dbMatches,
  selected,
  onActivate,
  onCancel,
  onQueryChange,
  onSelect,
  onRemove,
  onCreatePin,
}: {
  label: string
  isActive: boolean
  query: string
  collectionMatches: PinOption[]
  dbMatches: PinOption[]
  selected: PinOption[]
  onActivate: () => void
  onCancel: () => void
  onQueryChange: (q: string) => void
  onSelect: (pin: PinOption) => void
  onRemove: (id: string) => void
  onCreatePin: (name: string) => void
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontWeight: '700', fontSize: 15, marginBottom: 8 }}>{label}</Text>

      {selected.map(pin => (
        <View
          key={pin.id}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 8, backgroundColor: '#f0f0f0', marginBottom: 6 }}
        >
          <Text>{pin.name}</Text>
          <TouchableOpacity onPress={() => onRemove(pin.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: '#dc2626', fontSize: 18, fontWeight: '600' }}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      {!isActive ? (
        <TouchableOpacity
          onPress={onActivate}
          style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, alignItems: 'center' }}
        >
          <Text style={{ color: '#555' }}>+ Add pin</Text>
        </TouchableOpacity>
      ) : (
        <View>
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search pins..."
            autoFocus
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 6 }}
          />
          <TouchableOpacity onPress={onCancel} style={{ marginBottom: 10 }}>
            <Text style={{ color: '#888', fontSize: 13 }}>Cancel</Text>
          </TouchableOpacity>

          {collectionMatches.length > 0 && (
            <>
              <Text style={{ fontSize: 11, color: '#888', fontWeight: '600', marginBottom: 4, letterSpacing: 0.5 }}>
                IN YOUR COLLECTION
              </Text>
              {collectionMatches.map(p => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => onSelect(p)}
                  style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#000', backgroundColor: '#f5f5f5', marginBottom: 6 }}
                >
                  <Text>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {dbMatches.length > 0 && (
            <>
              <Text style={{ fontSize: 11, color: '#888', fontWeight: '600', marginBottom: 4, marginTop: 4, letterSpacing: 0.5 }}>
                ALL PINS
              </Text>
              {dbMatches.map(p => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => onSelect(p)}
                  style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 6 }}
                >
                  <Text>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {query.trim().length > 0 && (
            <TouchableOpacity
              onPress={() => onCreatePin(query.trim())}
              style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#aaa', marginTop: 4 }}
            >
              <Text style={{ color: '#555' }}>Create "{query.trim()}"</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

export default function NewTradeScreen() {
  const { session } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [partnerQuery, setPartnerQuery] = useState('')
  const [profileResults, setProfileResults] = useState<ProfileResult[]>([])
  const [partner, setPartner] = useState<Partner | null>(null)

  const [myCollection, setMyCollection] = useState<PinOption[]>([])

  const [activeSearch, setActiveSearch] = useState<'gave' | 'received' | null>(null)
  const [pinQuery, setPinQuery] = useState('')
  const [dbPinResults, setDbPinResults] = useState<PinOption[]>([])

  const [gavePins, setGavePins] = useState<PinOption[]>([])
  const [receivedPins, setReceivedPins] = useState<PinOption[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    supabase
      .from('user_pins')
      .select('pin:pins(id, name)')
      .eq('user_id', session.user.id)
      .eq('in_collection', true)
      .then(({ data }) => {
        setMyCollection(
          (data ?? []).flatMap(up => (up.pin ? [up.pin as PinOption] : []))
        )
      })
  }, [])

  useEffect(() => {
    if (partnerQuery.length < 2) { setProfileResults([]); return }
    const timer = setTimeout(() => {
      supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${partnerQuery}%`)
        .neq('id', session?.user.id ?? '')
        .limit(6)
        .then(({ data }) => setProfileResults(data ?? []))
    }, 300)
    return () => clearTimeout(timer)
  }, [partnerQuery])

  useEffect(() => {
    if (!pinQuery.trim() || !activeSearch) { setDbPinResults([]); return }
    const timer = setTimeout(() => {
      supabase
        .from('pins')
        .select('id, name')
        .ilike('name', `%${pinQuery}%`)
        .limit(10)
        .then(({ data }) => setDbPinResults(data ?? []))
    }, 300)
    return () => clearTimeout(timer)
  }, [pinQuery, activeSearch])

  const selectPartner = (p: Partner) => {
    setPartner(p)
    setPartnerQuery('')
    setProfileResults([])
  }

  const openSearch = (side: 'gave' | 'received') => {
    setActiveSearch(side)
    setPinQuery('')
    setDbPinResults([])
  }

  const closeSearch = () => {
    setActiveSearch(null)
    setPinQuery('')
    setDbPinResults([])
  }

  const addPin = (pin: PinOption, side: 'gave' | 'received') => {
    const current = side === 'gave' ? gavePins : receivedPins
    if (current.find(p => p.id === pin.id)) { closeSearch(); return }
    if (side === 'gave') setGavePins(prev => [...prev, pin])
    else setReceivedPins(prev => [...prev, pin])
    closeSearch()
  }

  const createAndAddPin = async (name: string, side: 'gave' | 'received') => {
    const { data, error } = await supabase
      .from('pins')
      .insert({ name })
      .select('id, name')
      .single()
    if (error || !data) { Alert.alert('Error', error?.message ?? 'Could not create pin'); return }
    addPin(data, side)
  }

  const removePin = (id: string, side: 'gave' | 'received') => {
    if (side === 'gave') setGavePins(prev => prev.filter(p => p.id !== id))
    else setReceivedPins(prev => prev.filter(p => p.id !== id))
  }

  const submit = async () => {
    if (!partner) { Alert.alert('Missing partner', 'Select who you traded with.'); return }
    if (gavePins.length === 0 && receivedPins.length === 0) {
      Alert.alert('No pins', 'Add at least one pin to the trade.'); return
    }
    setSubmitting(true)

    let receiverProfileId: string | null = null
    let receiverContactId: string | null = null

    if (partner.type === 'profile') {
      receiverProfileId = partner.id
    } else {
      const { data: contact, error } = await supabase
        .from('contacts')
        .upsert({ user_id: session!.user.id, name: partner.name }, { onConflict: 'user_id,name' })
        .select('id')
        .single()
      if (error || !contact) {
        Alert.alert('Error', error?.message ?? 'Could not save contact')
        setSubmitting(false)
        return
      }
      receiverContactId = contact.id
    }

    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({ initiator_id: session!.user.id, receiver_profile_id: receiverProfileId, receiver_contact_id: receiverContactId })
      .select('id')
      .single()

    if (tradeError || !trade) {
      Alert.alert('Error', tradeError?.message ?? 'Could not record trade')
      setSubmitting(false)
      return
    }

    const items = [
      ...gavePins.map(p => ({ trade_id: trade.id, pin_id: p.id, side: 'gave' })),
      ...receivedPins.map(p => ({ trade_id: trade.id, pin_id: p.id, side: 'received' })),
    ]

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('trade_items').insert(items)
      if (itemsError) {
        Alert.alert('Error', itemsError.message)
        await supabase.from('trades').delete().eq('id', trade.id)
        setSubmitting(false)
        return
      }
    }

    router.replace(`/(app)/trades/${trade.id}`)
  }

  const collectionMatches = pinQuery.trim()
    ? myCollection.filter(p => p.name.toLowerCase().includes(pinQuery.toLowerCase()))
    : []
  const myCollectionIds = new Set(myCollection.map(p => p.id))
  const dbOnlyMatches = dbPinResults.filter(p => !myCollectionIds.has(p.id))

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: '#555' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24 }}>Record a trade</Text>

      {/* Partner */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontWeight: '700', fontSize: 15, marginBottom: 8 }}>Who did you trade with?</Text>

        {partner ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: '#f0f0f0' }}>
            <View>
              <Text style={{ fontWeight: '600' }}>
                {partner.type === 'profile' ? `@${partner.name}` : partner.name}
              </Text>
              {partner.type === 'contact' && (
                <Text style={{ fontSize: 12, color: '#888' }}>not on Pindex</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setPartner(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: '#dc2626', fontSize: 18, fontWeight: '600' }}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput
              value={partnerQuery}
              onChangeText={setPartnerQuery}
              placeholder="Search by username..."
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 4 }}
            />
            {profileResults.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => selectPartner({ type: 'profile', id: p.id, name: p.username })}
                style={{ padding: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' }}
              >
                <Text>@{p.username}</Text>
              </TouchableOpacity>
            ))}
            {partnerQuery.trim().length >= 2 && (
              <TouchableOpacity
                onPress={() => selectPartner({ type: 'contact', name: partnerQuery.trim() })}
                style={{ padding: 10, borderRadius: 8, backgroundColor: '#f5f5f5', marginTop: 4 }}
              >
                <Text style={{ color: '#555' }}>Add "{partnerQuery.trim()}" as contact</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <PinSearchSection
        label="You gave"
        isActive={activeSearch === 'gave'}
        query={activeSearch === 'gave' ? pinQuery : ''}
        collectionMatches={activeSearch === 'gave' ? collectionMatches : []}
        dbMatches={activeSearch === 'gave' ? dbOnlyMatches : []}
        selected={gavePins}
        onActivate={() => openSearch('gave')}
        onCancel={closeSearch}
        onQueryChange={setPinQuery}
        onSelect={pin => addPin(pin, 'gave')}
        onRemove={id => removePin(id, 'gave')}
        onCreatePin={name => createAndAddPin(name, 'gave')}
      />

      <PinSearchSection
        label="You received"
        isActive={activeSearch === 'received'}
        query={activeSearch === 'received' ? pinQuery : ''}
        collectionMatches={activeSearch === 'received' ? collectionMatches : []}
        dbMatches={activeSearch === 'received' ? dbOnlyMatches : []}
        selected={receivedPins}
        onActivate={() => openSearch('received')}
        onCancel={closeSearch}
        onQueryChange={setPinQuery}
        onSelect={pin => addPin(pin, 'received')}
        onRemove={id => removePin(id, 'received')}
        onCreatePin={name => createAndAddPin(name, 'received')}
      />

      <TouchableOpacity
        onPress={submit}
        disabled={submitting}
        style={{ backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: '#fff', fontWeight: '600' }}>Record trade</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}
