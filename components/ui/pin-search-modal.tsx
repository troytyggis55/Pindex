import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { Search, Plus } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { ModalCard } from '@/components/ui/modal-card'
import { PinCard } from '@/components/ui/pin-card'
import { Colors } from '@/constants/theme'
import type { TradePinOption } from '@/types'

export type PinSearchProps = {
  visible: boolean
  userId: string
  onSelect: (pin: TradePinOption) => void
  onCancel: () => void
}

export function PinSearchModal({ visible, userId, onSelect, onCancel }: PinSearchProps) {
  const [query, setQuery] = useState('')
  const [collection, setCollection] = useState<TradePinOption[]>([])
  const [dbResults, setDbResults] = useState<TradePinOption[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    supabase
      .from('user_pins')
      .select('pin:pins(*, organization:organizations(*))')
      .eq('user_id', userId)
      .eq('in_collection', true)
      .then(({ data }) => {
        setCollection((data ?? []).flatMap(up => (up.pin ? [up.pin as TradePinOption] : [])))
      })
  }, [userId])

  useEffect(() => {
    if (!visible) {
      const id = setTimeout(() => { setQuery(''); setDbResults([]) }, 0)
      return () => clearTimeout(id)
    }
  }, [visible])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) { setDbResults([]); return }
      supabase
        .from('pins')
        .select('*, organization:organizations(*)')
        .ilike('name', `%${query}%`)
        .limit(20)
        // Cast needed: supabase types are stale — `color` exists in DB but not yet in generated types
        .then(({ data }) => setDbResults((data ?? []) as TradePinOption[]))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleCreate = async () => {
    const name = query.trim()
    if (!name) return
    setCreating(true)
    const { data, error } = await supabase
      .from('pins')
      .insert({ name, created_by: userId })
      .select('*, organization:organizations(*)')
      .single()
    setCreating(false)
    if (error || !data) { Alert.alert('Error', error?.message ?? 'Could not create pin'); return }
    onSelect(data as TradePinOption)
  }

  const q = query.trim().toLowerCase()
  const collectionIds = new Set(collection.map(p => p.id))
  const collectionMatches = q ? collection.filter(p => p.name.toLowerCase().includes(q)) : collection
  const dbOnlyResults = dbResults.filter(p => !collectionIds.has(p.id))

  const renderGrid = (pins: TradePinOption[]) => (
    <View className="flex-row flex-wrap px-2">
      {pins.map(p => (
        <View key={p.id} style={{ width: '33.33%' }} className="items-center mb-4">
          <PinCard
            id={p.id}
            name={p.name}
            imageUrl={p.image_url}
            orgColor={p.organization?.color}
            isConfirmed={p.organization_id != null}
            onPress={() => onSelect(p)}
          />
        </View>
      ))}
    </View>
  )

  return (
    <ModalCard visible={visible} onClose={onCancel}>
      {/* Search bar */}
      <View className="flex-row items-center gap-2 px-4 py-3 border-b border-gray-200">
        <Search size={14} color={Colors.dark.muted} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search pins..."
          placeholderTextColor={Colors.dark.muted}
          autoFocus
          className="flex-1 font-monda text-sm text-deep-black"
        />
        <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="font-monda-bold text-xs text-gray-500">Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingVertical: 16 }}>
        {/* Collection section */}
        {collectionMatches.length > 0 && (
          <>
            <Text className="font-monda-bold text-[10px] text-gray-500 tracking-widest px-4 mb-3">
              {q ? 'IN YOUR COLLECTION' : 'YOUR COLLECTION'}
            </Text>
            {renderGrid(collectionMatches)}
          </>
        )}

        {/* All-pins section */}
        {dbOnlyResults.length > 0 && (
          <>
            <Text
              className="font-monda-bold text-[10px] text-gray-500 tracking-widest px-4 mb-3"
              style={{ marginTop: collectionMatches.length > 0 ? 8 : 0 }}
            >
              ALL PINS
            </Text>
            {renderGrid(dbOnlyResults)}
          </>
        )}

        {/* Create new pin */}
        {query.trim().length > 0 && (
          <TouchableOpacity
            onPress={handleCreate}
            disabled={creating}
            className="flex-row items-center gap-2 px-4 py-3"
          >
            {creating
              ? <ActivityIndicator size="small" color={Colors.blue} />
              : <Plus size={14} color={Colors.blue} strokeWidth={2.5} />
            }
            <Text className="font-monda-bold text-[13px] text-pin-blue">
              {creating ? 'Creating...' : `Create "${query.trim()}"`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Empty states */}
        {!q && collection.length === 0 && (
          <Text className="font-monda text-[13px] text-gray-500 px-4">
            Your collection is empty — type to search all pins.
          </Text>
        )}
        {!!q && collectionMatches.length === 0 && dbOnlyResults.length === 0 && (
          <Text className="font-monda text-[13px] text-gray-500 px-4">
            No pins found — create one above.
          </Text>
        )}
      </ScrollView>
    </ModalCard>
  )
}
