import { useCallback, useMemo, useState } from 'react'
import { Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { OrgBadge } from '@/components/ui/org-badge'
import { Spacing } from '@/constants/theme'
import type { Organization } from '@/types'

export interface ExploreOrgsTabProps {
  query: string
}

export function ExploreOrgsTab({ query }: ExploreOrgsTabProps) {
  const router = useRouter()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('organizations').select('*').order('name')
    if (data) setOrgs(data)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load() }

  const q = query.trim().toLowerCase()
  const data = useMemo(() => (q ? orgs.filter(o => o.name.toLowerCase().includes(q)) : orgs), [orgs, q])

  return (
    <FlatList
      data={data}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      keyExtractor={o => o.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: Spacing.navOffset + 16, gap: 10 }}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator className="mt-10" />
        ) : (
          <Text className="font-monda text-gray-500 text-center mt-10">No organizations found.</Text>
        )
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push(`/orgs/${item.id}`)}
          className="flex-row items-center gap-3 bg-white rounded-card p-3.5"
        >
          <OrgBadge name={item.name} logoUrl={item.logo_url} size={40} />
          <Text className="font-monda-bold text-[15px] text-deep-black flex-1">{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  )
}
