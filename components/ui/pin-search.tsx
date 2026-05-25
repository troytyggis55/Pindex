import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { Search, Plus } from 'lucide-react-native'
import { Colors, Radius } from '@/constants/theme'
import type { TradePinOption } from '@/types'

export type PinSearchProps = {
  query: string
  collectionMatches: TradePinOption[]
  dbMatches: TradePinOption[]
  onQueryChange: (q: string) => void
  onSelect: (pin: TradePinOption) => void
  onCreatePin: (name: string) => void
  onCancel: () => void
}

export function PinSearch({
  query,
  collectionMatches,
  dbMatches,
  onQueryChange,
  onSelect,
  onCreatePin,
  onCancel,
}: PinSearchProps) {
  return (
    <View
      className="bg-white rounded-card p-3.5"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
      }}
    >
      {/* Search row */}
      <View className="flex-row items-center gap-2 mb-3">
        <Search size={14} color={Colors.dark.muted} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search pins..."
          placeholderTextColor={Colors.dark.muted}
          autoFocus
          className="flex-1 font-monda text-sm text-deep-black"
        />
        <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="font-monda-bold text-xs text-gray-500">Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Collection results */}
      {collectionMatches.length > 0 && (
        <>
          <Text className="font-monda-bold text-[10px] text-gray-500 tracking-widest mb-1.5">
            IN YOUR COLLECTION
          </Text>
          {collectionMatches.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => onSelect(p)}
              className="flex-row items-center gap-2 py-2.5"
              style={{ borderBottomWidth: 1, borderColor: '#f0f0ee' }}
            >
              <View className="w-1.5 h-1.5 rounded-full bg-pin-green" />
              <Text className="font-monda text-sm text-deep-black">{p.name}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* All-pins results */}
      {dbMatches.length > 0 && (
        <>
          <Text
            className="font-monda-bold text-[10px] text-gray-500 tracking-widest mb-1.5"
            style={{ marginTop: collectionMatches.length > 0 ? 12 : 0 }}
          >
            ALL PINS
          </Text>
          {dbMatches.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => onSelect(p)}
              className="py-2.5"
              style={{ borderBottomWidth: 1, borderColor: '#f0f0ee' }}
            >
              <Text className="font-monda text-sm text-deep-black">{p.name}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Create new pin */}
      {query.trim().length > 0 && (
        <TouchableOpacity
          onPress={() => onCreatePin(query.trim())}
          className="flex-row items-center gap-2 py-2.5 mt-1"
        >
          <Plus size={14} color={Colors.blue} strokeWidth={2.5} />
          <Text className="font-monda-bold text-[13px] text-pin-blue">
            Create "{query.trim()}"
          </Text>
        </TouchableOpacity>
      )}

      {/* Empty state */}
      {query.trim().length === 0 && collectionMatches.length === 0 && dbMatches.length === 0 && (
        <Text className="font-monda text-[13px] text-gray-500">
          Start typing to search pins...
        </Text>
      )}
    </View>
  )
}
