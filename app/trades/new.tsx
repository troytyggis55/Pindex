import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, X, Search, Plus } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { Colors, Radius, Spacing } from '@/constants/theme'
import type { Pin } from '@/types'

type PinOption = Pick<Pin, 'id' | 'name'>
type Partner =
  | { type: 'profile'; id: string; name: string }
  | { type: 'contact'; name: string }
type ProfileResult = { id: string; username: string }

// ── Pin chip (selected pin in a half) ─────────────────────────────────────────
function PinChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: Radius.btn,
      paddingLeft: 12,
      paddingRight: 6,
      paddingVertical: 6,
      gap: 6,
    }}>
      <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 13, color: '#fff', flex: 1 }}>{name}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <X size={14} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  )
}

// ── Pin search dropdown ────────────────────────────────────────────────────────
function PinSearch({
  query,
  collectionMatches,
  dbMatches,
  onQueryChange,
  onSelect,
  onCreatePin,
  onCancel,
}: {
  query: string
  collectionMatches: PinOption[]
  dbMatches: PinOption[]
  onQueryChange: (q: string) => void
  onSelect: (pin: PinOption) => void
  onCreatePin: (name: string) => void
  onCancel: () => void
}) {
  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: Radius.card,
      padding: 12,
      marginHorizontal: Spacing.screenPad,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Search size={14} color={Colors.dark.muted} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search pins..."
          placeholderTextColor={Colors.dark.muted}
          autoFocus
          style={{ flex: 1, fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack }}
        />
        <TouchableOpacity onPress={onCancel}>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 12, color: Colors.dark.muted }}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {collectionMatches.length > 0 && (
        <>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 11, color: Colors.dark.muted, letterSpacing: 0.5, marginBottom: 6 }}>
            IN YOUR COLLECTION
          </Text>
          {collectionMatches.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => onSelect(p)}
              style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0ee', flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green }} />
              <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack }}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {dbMatches.length > 0 && (
        <>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 11, color: Colors.dark.muted, letterSpacing: 0.5, marginBottom: 6, marginTop: collectionMatches.length > 0 ? 10 : 0 }}>
            ALL PINS
          </Text>
          {dbMatches.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => onSelect(p)}
              style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0ee' }}
            >
              <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack }}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {query.trim().length > 0 && (
        <TouchableOpacity
          onPress={() => onCreatePin(query.trim())}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 10,
            marginTop: 4,
          }}
        >
          <Plus size={14} color={Colors.blue} strokeWidth={2.5} />
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 13, color: Colors.blue }}>
            Create "{query.trim()}"
          </Text>
        </TouchableOpacity>
      )}

      {query.trim().length === 0 && collectionMatches.length === 0 && dbMatches.length === 0 && (
        <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 13, color: Colors.dark.muted }}>
          Start typing to search pins...
        </Text>
      )}
    </View>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────────
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
        setMyCollection((data ?? []).flatMap(up => (up.pin ? [up.pin as PinOption] : [])))
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
    const { data, error } = await supabase.from('pins').insert({ name }).select('id, name').single()
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

  const username = session?.user.email?.split('@')[0] ?? 'You'

  return (
    <View style={{ flex: 1, backgroundColor: Colors.offWhite }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={activeSearch === null}
      >
        {/* Header */}
        <View style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: Spacing.screenPad,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={22} color={Colors.deepBlack} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 22, color: Colors.deepBlack }}>
            Record a trade
          </Text>
        </View>

        {/* ── Top half: trading partner ── */}
        <View style={{
          backgroundColor: Colors.deepBlack,
          marginHorizontal: Spacing.screenPad,
          borderRadius: Radius.card,
          padding: 16,
          minHeight: 160,
          marginBottom: 10,
        }}>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8, marginBottom: 10 }}>
            TRADING PARTNER
          </Text>

          {/* Partner selector */}
          {partner ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: Radius.btn,
              padding: 10,
              marginBottom: 12,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 14, color: '#fff' }}>
                  {partner.type === 'profile' ? `@${partner.name}` : partner.name}
                </Text>
                {partner.type === 'contact' && (
                  <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    Not on Pindex
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setPartner(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color="rgba(255,255,255,0.6)" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginBottom: 10 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: Radius.btn,
                paddingHorizontal: 12,
                marginBottom: 6,
              }}>
                <Search size={13} color="rgba(255,255,255,0.5)" strokeWidth={2} />
                <TextInput
                  value={partnerQuery}
                  onChangeText={setPartnerQuery}
                  placeholder="Search by username..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={{ flex: 1, fontFamily: 'Monda_400Regular', fontSize: 14, color: '#fff', paddingVertical: 10 }}
                />
              </View>
              {profileResults.map(p => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => selectPartner({ type: 'profile', id: p.id, name: p.username })}
                  style={{ paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 14, color: '#fff' }}>@{p.username}</Text>
                </TouchableOpacity>
              ))}
              {partnerQuery.trim().length >= 2 && (
                <TouchableOpacity
                  onPress={() => selectPartner({ type: 'contact', name: partnerQuery.trim() })}
                  style={{ paddingVertical: 8, paddingHorizontal: 4 }}
                >
                  <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    + Save "{partnerQuery.trim()}" as contact
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Their pins (received = what they gave us) */}
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8, marginBottom: 8 }}>
            THEIR PINS
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {receivedPins.map(p => (
              <PinChip key={p.id} name={p.name} onRemove={() => removePin(p.id, 'received')} />
            ))}
            {activeSearch !== 'received' && (
              <TouchableOpacity
                onPress={() => openSearch('received')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: Radius.btn,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(255,255,255,0.3)',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Plus size={12} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Add pin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Bottom half: current user ── */}
        <View style={{
          backgroundColor: Colors.blue,
          marginHorizontal: Spacing.screenPad,
          borderRadius: Radius.card,
          padding: 16,
          minHeight: 140,
          marginBottom: 16,
        }}>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8, marginBottom: 8 }}>
            YOUR PINS — @{username}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {gavePins.map(p => (
              <PinChip key={p.id} name={p.name} onRemove={() => removePin(p.id, 'gave')} />
            ))}
            {activeSearch !== 'gave' && (
              <TouchableOpacity
                onPress={() => openSearch('gave')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: Radius.btn,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(255,255,255,0.4)',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Plus size={12} color="rgba(255,255,255,0.6)" strokeWidth={2.5} />
                <Text style={{ fontFamily: 'Monda_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Add pin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit */}
        <View style={{ paddingHorizontal: Spacing.screenPad, paddingBottom: insets.bottom + 24 }}>
          <TouchableOpacity
            onPress={submit}
            disabled={submitting}
            style={{
              backgroundColor: Colors.red,
              paddingVertical: 16,
              borderRadius: Radius.btn,
              alignItems: 'center',
              shadowColor: Colors.red,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 15, color: '#fff' }}>Log trade</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pin search overlay */}
      {activeSearch !== null && (
        <View style={{
          position: 'absolute',
          top: insets.top + 60,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,14,25,0.5)',
        }}>
          <View style={{ marginTop: 8 }}>
            <PinSearch
              query={pinQuery}
              collectionMatches={collectionMatches}
              dbMatches={dbOnlyMatches}
              onQueryChange={setPinQuery}
              onSelect={pin => addPin(pin, activeSearch)}
              onCreatePin={name => createAndAddPin(name, activeSearch)}
              onCancel={closeSearch}
            />
          </View>
        </View>
      )}
    </View>
  )
}
