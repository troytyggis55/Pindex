import { useState } from 'react'
import {
  View, Text, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { X, ArrowUpDown, Plus, ChevronRight } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/auth'
import { UserSearchModal, type Partner } from '@/components/ui/user-search-modal'
import { UserCard } from '@/components/ui/user-card'
import { PinStack } from '@/components/ui/pin-stack'
import { AddPinButton } from '@/components/ui/add-pin-button'
import { PinSearchModal } from '@/components/ui/pin-search-modal'
import type { TradePinOption } from '@/types'

// ── Main screen ───────────────────────────────────────────────────────────────
export default function NewTradeScreen() {
  const { session, profile } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [partnerModalVisible, setPartnerModalVisible] = useState(true)
  const [partner, setPartner] = useState<Partner | null>(null)

  const [activeSearch, setActiveSearch] = useState<'gave' | 'received' | null>(null)
  const [gavePins, setGavePins] = useState<TradePinOption[]>([])
  const [receivedPins, setReceivedPins] = useState<TradePinOption[]>([])
  const [submitting, setSubmitting] = useState(false)

  const openSearch = (side: 'gave' | 'received') => setActiveSearch(side)
  const closeSearch = () => setActiveSearch(null)

  const addPin = (pin: TradePinOption, side: 'gave' | 'received') => {
    const current = side === 'gave' ? gavePins : receivedPins
    if (current.find(p => p.id === pin.id)) { closeSearch(); return }
    if (side === 'gave') setGavePins(prev => [...prev, pin])
    else setReceivedPins(prev => [...prev, pin])
    closeSearch()
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

  const username = profile?.username ?? session?.user.email?.split('@')[0] ?? 'You'

  return (
    <View className="flex-1 bg-deep-black">

      {/* Partner modal — opens immediately on mount, and on name tap */}
      <UserSearchModal
        visible={partnerModalVisible}
        userId={session?.user.id ?? ''}
        onSelect={p => setPartner(p)}
        onClose={() => setPartnerModalVisible(false)}
      />

      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute left-4 z-[30] w-9 h-9 rounded-full bg-white/[0.08] items-center justify-center"
        style={{ top: insets.top + 14 }}
      >
        <X size={17} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ── TOP HALF — trading partner ── */}
      <View
        className="flex-1 px-4 pb-8"
        style={{ paddingTop: insets.top + 64 }}
      >
        {/* Partner card — tap to change */}
        {partner ? (
          <UserCard
            id={partner.type === 'profile' ? partner.id : partner.name}
            username={partner.name}
            avatarUrl={partner.type === 'profile' ? partner.avatarUrl : null}
            atPrefix={partner.type === 'profile'}
            subtitle={partner.type === 'contact' ? 'Not on Pindex' : undefined}
            onPress={() => setPartnerModalVisible(true)}
            showChevron
          />
        ) : (
          <TouchableOpacity
            onPress={() => setPartnerModalVisible(true)}
            className="flex-row items-center gap-3 bg-white/[0.06] rounded-card p-3.5 border border-dashed border-white/20"
          >
            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
              <Plus size={20} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
            </View>
            <Text className="flex-1 font-monda text-[15px] text-white/40">
              Tap to select trading partner
            </Text>
            <ChevronRight size={16} color="rgba(255,255,255,0.4)" strokeWidth={2} />
          </TouchableOpacity>
        )}

        <View className="flex-1">
          <Text className="font-monda-bold text-[10px] text-off-white tracking-[1.4px] mb-[14px] mt-2 text-center">
            THEIR PIN
          </Text>

          {/* 4-wide grid: add button | merged center pin stack | empty */}
          <View className="flex-row items-center">
            <View className="flex-1 basis-0 items-center justify-center">
              <AddPinButton onPress={() => openSearch('received')} />
            </View>
            <View className="flex-[2] basis-0 items-center justify-center">
              <PinStack pins={receivedPins} size="medium" showEmptyPlaceholder={false} />
            </View>
            <View className="flex-1 basis-0" />
          </View>

          {/* Scrollable text list of their pins, same order as the stack */}
          <ScrollView className="flex-1 mt-3" showsVerticalScrollIndicator={true}>
            {receivedPins.map(p => (
              <View
                key={p.id}
                className="flex-row items-center justify-between py-2.5 border-b border-white/10"
              >
                <Text numberOfLines={1} className="flex-1 font-monda text-[14px] text-white/80">
                  {p.name}
                </Text>
                <TouchableOpacity
                  onPress={() => removePin(p.id, 'received')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="ml-3 w-7 h-7 rounded-full bg-white/[0.08] items-center justify-center"
                >
                  <X size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* ── POKEBALL DIVIDER — hidden during pin search ── */}
      {activeSearch === null && (
        <View className="h-16 items-center justify-center z-10">
          <View className="absolute left-0 right-0 h-1 bg-white/20" />
          <TouchableOpacity
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.85}
            className="w-16 h-16 rounded-full bg-pin-red items-center justify-center border-[3px] border-white/15"
            style={{
              shadowColor: '#CD0808',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.55,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <ArrowUpDown size={22} color="#fff" strokeWidth={2.5} />
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── BOTTOM HALF — current user ── */}
      <View
        className="flex-1 pt-8 px-4"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="flex-1">

          {/* Pin stack on the left, add button fixed on the right */}
          <View className="flex-row items-center">
            <View className="flex-1 basis-0 items-center justify-center">
              <AddPinButton onPress={() => openSearch('gave')} />
            </View>
            <View className="flex-[2] basis-0 items-center justify-center">
              <PinStack pins={gavePins} size="medium" showEmptyPlaceholder={false} />
            </View>
            <View className="flex-1 basis-0" />
          </View>

          {/* Scrollable text list of your pins, same order as the stack */}
          <ScrollView className="flex-1 mt-3" showsVerticalScrollIndicator={true}>
            {gavePins.map(p => (
              <View
                key={p.id}
                className="flex-row items-center justify-between py-2.5 border-b border-white/10"
              >
                <Text numberOfLines={1} className="flex-1 font-monda text-[14px] text-white/80">
                  {p.name}
                </Text>
                <TouchableOpacity
                  onPress={() => removePin(p.id, 'gave')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="ml-3 w-7 h-7 rounded-full bg-white/[0.08] items-center justify-center"
                >
                  <X size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <Text className="font-monda-bold text-[10px] text-off-white tracking-[1.4px] mb-2 text-center">
          YOUR PIN
        </Text>

        {/* Your card — bottom edge of the pokeball */}
        <UserCard
          id={session?.user.id ?? 'you'}
          username={username}
          avatarUrl={profile?.avatar_url}
        />
      </View>

      {/* ── PIN SEARCH ── */}
      <PinSearchModal
        visible={activeSearch !== null}
        userId={session!.user.id}
        onSelect={pin => activeSearch && addPin(pin, activeSearch)}
        onCancel={closeSearch}
      />
    </View>
  )
}
