import { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Text, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'
import { InfiniteList } from '@/components/infinite-list'
import { OrgBadge } from '@/components/ui/org-badge'
import { Spacing } from '@/constants/theme'
import type { Organization } from '@/types'

export interface ExploreOrgsTabProps {
  query: string
}

export function ExploreOrgsTab({ query }: ExploreOrgsTabProps) {
  const router = useRouter()
  const q = query.trim()

  const buildQuery = useCallback(
    (sb: typeof supabase) => {
      let base = sb.from('organizations').select('*')
      if (q) base = base.ilike('name', `%${q}%`)
      return base.order('name')
    },
    [q]
  )

  return (
    <InfiniteList<Organization>
      buildQuery={buildQuery}
      emptyText="No organizations found."
      contentContainerStyle={{ padding: Spacing.screenPad, paddingBottom: Spacing.navOffset + 16, gap: 10 }}
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
