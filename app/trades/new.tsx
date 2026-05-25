import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { X, Search, Plus, ArrowLeftRight } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { Colors, Radius, Spacing } from '@/constants/theme'
import { PinCard } from '@/components/ui/pin-card'
import { PartnerModal, type Partner } from '@/components/ui/partner-modal'
import type { TradePinOption } from '@/types'

const BALL_SIZE = 64
const PIN_CIRCLE = 76

// ── Pin card in trade list ────────────────────────────────────────────────────
function TradePinCard({ pin, onRemove }: { pin: TradePinOption; onRemove: () => void }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View>
        <PinCard
          id={pin.id}
          orgName={pin.organization?.name ?? 'Independent'}
          orgColor={pin.organization?.color}
          imageUrl={pin.image_url}
          isConfirmed={pin.organization_id != null}
        />
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{
            position: 'absolute',
            top: -4, right: -4,
            width: 20, height: 20,
            borderRadius: 10,
            backgroundColor: Colors.deepBlack,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={10} color="#fff" strokeWidth={3} />
        </TouchableOpacity>
      </View>
      <Text
        numberOfLines={1}
        style={{
          marginTop: 6,
          fontFamily: 'Monda_700Bold',
          fontSize: 11,
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          width: PIN_CIRCLE + 16,
        }}
      >
        {pin.name}
      </Text>
    </View>
  )
}

// ── Add-pin circle (matches PinCard size) ─────────────────────────────────────
function AddPinButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center' }}>
      <View style={{
        width: PIN_CIRCLE, height: PIN_CIRCLE,
        borderRadius: PIN_CIRCLE / 2,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Plus size={22} color="rgba(255,255,255,0.4)" strokeWidth={2} />
      </View>
      <Text style={{
        marginTop: 6,
        fontFamily: 'Monda_400Regular',
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
      }}>
        Add pin
      </Text>
    </TouchableOpacity>
  )
}

// ── Pin search overlay panel ──────────────────────────────────────────────────
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
  collectionMatches: TradePinOption[]
  dbMatches: TradePinOption[]
  onQueryChange: (q: string) => void
  onSelect: (pin: TradePinOption) => void
  onCreatePin: (name: string) => void
  onCancel: () => void
}) {
  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: Radius.card,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Search size={14} color={Colors.dark.muted} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search pins..."
          placeholderTextColor={Colors.dark.muted}
          autoFocus
          style={{ flex: 1, fontFamily: 'Monda_400Regular', fontSize: 14, color: Colors.deepBlack }}
        />
        <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 12, color: Colors.dark.muted }}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {collectionMatches.length > 0 && (
        <>
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 10, color: Colors.dark.muted, letterSpacing: 0.8, marginBottom: 6 }}>
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
          <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 10, color: Colors.dark.muted, letterSpacing: 0.8, marginBottom: 6, marginTop: collectionMatches.length > 0 ? 12 : 0 }}>
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
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginTop: 4 }}
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function NewTradeScreen() {
  const { session } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [partnerModalVisible, setPartnerModalVisible] = useState(true)
  const [partner, setPartner] = useState<Partner | null>(null)

  const [myCollection, setMyCollection] = useState<TradePinOption[]>([])

  const [activeSearch, setActiveSearch] = useState<'gave' | 'received' | null>(null)
  const [pinQuery, setPinQuery] = useState('')
  const [dbPinResults, setDbPinResults] = useState<TradePinOption[]>([])

  const [gavePins, setGavePins] = useState<TradePinOption[]>([])
  const [receivedPins, setReceivedPins] = useState<TradePinOption[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    supabase
      .from('user_pins')
      .select('pin:pins(*, organization:organizations(*))')
      .eq('user_id', session.user.id)
      .eq('in_collection', true)
      .then(({ data }) => {
        setMyCollection((data ?? []).flatMap(up => (up.pin ? [up.pin as TradePinOption] : [])))
      })
  }, [])

  useEffect(() => {
    if (!pinQuery.trim() || !activeSearch) { setDbPinResults([]); return }
    const timer = setTimeout(() => {
      supabase
        .from('pins')
        .select('*, organization:organizations(*)')
        .ilike('name', `%${pinQuery}%`)
        .limit(10)
        // Cast needed: supabase types are stale — `color` exists in DB but not yet in generated types
        .then(({ data }) => setDbPinResults((data ?? []) as TradePinOption[]))
    }, 300)
    return () => clearTimeout(timer)
  }, [pinQuery, activeSearch])

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

  const addPin = (pin: TradePinOption, side: 'gave' | 'received') => {
    const current = side === 'gave' ? gavePins : receivedPins
    if (current.find(p => p.id === pin.id)) { closeSearch(); return }
    if (side === 'gave') setGavePins(prev => [...prev, pin])
    else setReceivedPins(prev => [...prev, pin])
    closeSearch()
  }

  const createAndAddPin = async (name: string, side: 'gave' | 'received') => {
    const { data, error } = await supabase
      .from('pins')
      .insert({ name, created_by: session!.user.id })
      .select('*, organization:organizations(*)')
      .single()
    if (error || !data) { Alert.alert('Error', error?.message ?? 'Could not create pin'); return }
    addPin(data as TradePinOption, side)
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

    router.back()
  }

  const collectionMatches = pinQuery.trim()
    ? myCollection.filter(p => p.name.toLowerCase().includes(pinQuery.toLowerCase()))
    : []
  const myCollectionIds = new Set(myCollection.map(p => p.id))
  const dbOnlyMatches = dbPinResults.filter(p => !myCollectionIds.has(p.id))

  const username = session?.user.email?.split('@')[0] ?? 'You'

  return (
    <View style={{ flex: 1, backgroundColor: Colors.deepBlack }}>

      {/* Partner modal — opens immediately on mount, and on name tap */}
      <PartnerModal
        visible={partnerModalVisible}
        userId={session?.user.id ?? ''}
        onSelect={p => setPartner(p)}
        onClose={() => setPartnerModalVisible(false)}
      />

      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + 14,
          left: Spacing.screenPad,
          zIndex: 30,
          width: 36, height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={17} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ── TOP HALF — trading partner ── */}
      <View style={{
        flex: 1,
        paddingTop: insets.top + 64,
        paddingHorizontal: Spacing.screenPad,
        paddingBottom: 16,
      }}>
        <Text style={{
          fontFamily: 'Monda_700Bold',
          fontSize: 10,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: 1.4,
          marginBottom: 10,
        }}>
          TRADING PARTNER
        </Text>

        {/* Partner name — tap to change */}
        <TouchableOpacity
          onPress={() => setPartnerModalVisible(true)}
          style={{ marginBottom: 20 }}
        >
          {partner ? (
            <>
              <Text style={{ fontFamily: 'Monda_700Bold', fontSize: 24, color: '#fff' }}>
                {partner.type === 'profile' ? `@${partner.name}` : partner.name}
              </Text>
              {partner.type === 'contact' && (
                <Text style={{
                  fontFamily: 'Monda_400Regular',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: 2,
                }}>
                  Not on Pindex
                </Text>
              )}
            </>
          ) : (
            <Text style={{
              fontFamily: 'Monda_400Regular',
              fontSize: 16,
              color: 'rgba(255,255,255,0.3)',
            }}>
              Tap to select trading partner...
            </Text>
          )}
        </TouchableOpacity>

        <Text style={{
          fontFamily: 'Monda_700Bold',
          fontSize: 10,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: 1.4,
          marginBottom: 14,
        }}>
          THEIR PINS
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
            {receivedPins.map(p => (
              <TradePinCard key={p.id} pin={p} onRemove={() => removePin(p.id, 'received')} />
            ))}
            {activeSearch !== 'received' && (
              <AddPinButton onPress={() => openSearch('received')} />
            )}
          </View>
        </ScrollView>
      </View>

      {/* ── POKEBALL DIVIDER — hidden during pin search ── */}
      {activeSearch === null && (
        <View style={{ height: BALL_SIZE, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <View style={{
            position: 'absolute',
            left: 0, right: 0,
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
          }} />
          <TouchableOpacity
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.85}
            style={{
              width: BALL_SIZE, height: BALL_SIZE,
              borderRadius: BALL_SIZE / 2,
              backgroundColor: Colors.red,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.15)',
              shadowColor: Colors.red,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.55,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <ArrowLeftRight size={22} color="#fff" strokeWidth={2.5} />
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── BOTTOM HALF — current user ── */}
      <View style={{
        flex: 1,
        paddingTop: 16,
        paddingHorizontal: Spacing.screenPad,
        paddingBottom: insets.bottom + 24,
      }}>
        <Text style={{
          fontFamily: 'Monda_700Bold',
          fontSize: 10,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: 1.4,
          marginBottom: 14,
        }}>
          YOUR PINS — @{username}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
            {gavePins.map(p => (
              <TradePinCard key={p.id} pin={p} onRemove={() => removePin(p.id, 'gave')} />
            ))}
            {activeSearch !== 'gave' && (
              <AddPinButton onPress={() => openSearch('gave')} />
            )}
          </View>
        </ScrollView>
      </View>

      {/* ── PIN SEARCH OVERLAY ── */}
      {activeSearch !== null && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,14,25,0.75)',
          justifyContent: 'center',
          paddingHorizontal: Spacing.screenPad,
        }}>
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
      )}
    </View>
  )
}
