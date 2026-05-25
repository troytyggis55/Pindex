import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, ScrollView, Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Search } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'

export type Partner =
  | { type: 'profile'; id: string; name: string }
  | { type: 'contact'; name: string }

type ProfileResult = { id: string; username: string }

const SHEET_HEIGHT = Dimensions.get('window').height * 0.72

interface PartnerModalProps {
  visible: boolean
  userId: string
  onSelect: (p: Partner) => void
  onClose: () => void
}

export function PartnerModal({ visible, userId, onSelect, onClose }: PartnerModalProps) {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileResult[]>([])
  const [following, setFollowing] = useState<ProfileResult[]>([])

  // Fetch the people this user follows, sorted by when they joined Pindex
  useEffect(() => {
    if (!userId) return
    supabase
      .from('follows')
      .select('profile:profiles!following_id(id, username, created_at)')
      .eq('follower_id', userId)
      .order('created_at', { referencedTable: 'profiles', ascending: false })
      .limit(20)
      .then(({ data }) => {
        const profiles = (data ?? [])
          .flatMap(row => (row.profile ? [row.profile as ProfileResult] : []))
        setFollowing(profiles)
      })
  }, [userId])

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) { setQuery(''); setResults([]) }
  }, [visible])

  // Debounced username search
  useEffect(() => {
    if (query.length < 1) { setResults([]); return }
    const timer = setTimeout(() => {
      supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${query}%`)
        .neq('id', userId)
        .limit(8)
        .then(({ data }) => setResults(data ?? []))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handle = (p: Partner) => { onSelect(p); onClose() }

  const isSearching = query.length > 0

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* On iOS: 'position' shifts the sheet upward as a unit, preserving its height.
          On Android: let the OS handle keyboard avoidance via windowSoftInputMode. */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'position' : undefined}
      >
        <View className="flex-1 justify-end">
          {/* Tap backdrop to dismiss */}
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />

          {/* Sheet — fixed height, small horizontal margin for a floating look */}
          <View
            className="bg-off-white rounded-t-3xl mx-3 overflow-hidden"
            style={{ height: SHEET_HEIGHT, paddingBottom: insets.bottom + 24 }}
          >
            <View className="flex-1 px-4 pt-6">
              <Text className="font-monda-bold text-xl text-deep-black mb-5">
                Who are you trading with?
              </Text>

              {/* Search bar */}
              <View className="flex-row items-center gap-2 bg-gray-100 rounded-btn px-3.5 mb-3">
                <Search size={14} color="#6B7280" strokeWidth={2} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search by username..."
                  placeholderTextColor="#6B7280"
                  autoFocus
                  className="flex-1 font-monda text-sm text-deep-black py-3"
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color="#6B7280" strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >

                {!isSearching && following.length === 0 && (
                  <Text className="font-monda text-[13px] text-gray-400 mt-2">
                    Search for a Pindex user, or type a name to add as a contact.
                  </Text>
                )}

                {/* ── Active search: show results + "not on Pindex" option ── */}
                {isSearching && results.length > 0 && (
                  <>
                    <Text className="font-monda-bold text-[10px] text-gray-400 tracking-widest mb-1.5">
                      RESULTS
                    </Text>
                    {results.map(p => (
                      <ProfileRow
                        key={p.id}
                        profile={p}
                        onPress={() => handle({ type: 'profile', id: p.id, name: p.username })}
                      />
                    ))}
                  </>
                )}

                
                {isSearching && query.trim().length >= 2 && (
                  <TouchableOpacity
                    onPress={() => handle({ type: 'contact', name: query.trim() })}
                    className="flex-row items-center justify-between py-3 px-1 border-b border-gray-100"
                  >
                    <Text className="font-monda-bold text-sm text-deep-black">
                      {query.trim()}
                    </Text>
                    <Text className="font-monda text-xs text-gray-400">
                      Not on Pindex
                    </Text>
                  </TouchableOpacity>
                )}
              
                <Text className="font-monda-bold text-[10px] text-gray-400 tracking-widest mb-1.5">
                  FOLLOWING
                </Text>
                {following.map(p => (
                  <ProfileRow
                    key={p.id}
                    profile={p}
                    onPress={() => handle({ type: 'profile', id: p.id, name: p.username })}
                  />
                ))}

              </ScrollView>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ── Shared profile row ────────────────────────────────────────────────────────
function ProfileRow({ profile, onPress }: { profile: ProfileResult; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-2.5 py-3 px-1 border-b border-gray-100"
    >
      <View className="w-8 h-8 rounded-full bg-deep-black items-center justify-center">
        <Text className="font-monda-bold text-[13px] text-white">
          {profile.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text className="font-monda text-sm text-deep-black">
        @{profile.username}
      </Text>
    </TouchableOpacity>
  )
}
