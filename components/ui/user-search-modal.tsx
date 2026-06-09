import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { X, Search } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { ModalCard } from '@/components/ui/modal-card'
import { UserCard } from '@/components/ui/user-card'

export type Partner =
  | { type: 'profile'; id: string; name: string; avatarUrl?: string | null }
  | { type: 'contact'; name: string }

type ProfileResult = { id: string; username: string; avatar_url: string | null }

interface PartnerModalProps {
  visible: boolean
  userId: string
  onSelect: (p: Partner) => void
  onClose: () => void
}

export function UserSearchModal({ visible, userId, onSelect, onClose }: PartnerModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileResult[]>([])
  const [following, setFollowing] = useState<ProfileResult[]>([])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('follows')
      .select('profile:profiles!following_id(id, username, avatar_url, created_at)')
      .eq('follower_id', userId)
      .order('created_at', { referencedTable: 'profiles', ascending: false })
      .limit(20)
      .then(({ data }) => {
        setFollowing((data ?? []).flatMap(row => (row.profile ? [row.profile as ProfileResult] : [])))
      })
  }, [userId])

  useEffect(() => {
    if (!visible) {
      const id = setTimeout(() => { setQuery(''); setResults([]) }, 0)
      return () => clearTimeout(id)
    }
  }, [visible])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length < 1) { setResults([]); return }
      supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', userId)
        .not('username', 'is', null)
        .limit(8)
        .then(({ data }) =>
          setResults((data ?? []).filter((p): p is ProfileResult => p.username !== null)),
        )
    }, 300)
    return () => clearTimeout(timer)
  }, [query, userId])

  const handle = (p: Partner) => { onSelect(p); onClose() }
  const isSearching = query.length > 0

  return (
    <ModalCard visible={visible} onClose={onClose}>
      <View className="flex-1 px-4 pt-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="font-monda-bold text-xl text-deep-black">
            Who are you trading with?
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={20} color="#6B7280" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

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
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color="#6B7280" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
          {!isSearching && following.length > 0 && (
            <>
              <Text className="font-monda-bold text-[10px] text-gray-400 tracking-widest mb-1.5">
                FOLLOWING
              </Text>
              {following.map(p => (
                <UserCard
                  key={p.id}
                  id={p.id}
                  username={p.username}
                  avatarUrl={p.avatar_url}
                  onPress={() => handle({ type: 'profile', id: p.id, name: p.username, avatarUrl: p.avatar_url })}
                  card={false}
                />
              ))}
            </>
          )}

          {!isSearching && following.length === 0 && (
            <Text className="font-monda text-[13px] text-gray-400 mt-2">
              Search for a Pindex user, or type a name to add as a contact.
            </Text>
          )}

          {isSearching && results.length > 0 && (
            <>
              <Text className="font-monda-bold text-[10px] text-gray-400 tracking-widest mb-1.5">
                RESULTS
              </Text>
              {results.map(p => (
                <UserCard
                  key={p.id}
                  id={p.id}
                  username={p.username}
                  avatarUrl={p.avatar_url}
                  onPress={() => handle({ type: 'profile', id: p.id, name: p.username, avatarUrl: p.avatar_url })}
                  card={false}
                />
              ))}
            </>
          )}

          {isSearching && query.trim().length >= 2 && (
            <TouchableOpacity
              onPress={() => handle({ type: 'contact', name: query.trim() })}
              className="flex-row items-center justify-between py-3 px-1 border-b border-gray-100"
            >
              <Text className="font-monda-bold text-sm text-deep-black">{query.trim()}</Text>
              <Text className="font-monda text-xs text-gray-400">Not on Pindex</Text>
            </TouchableOpacity>
          )}
        </KeyboardAwareScrollView>
      </View>
    </ModalCard>
  )
}
