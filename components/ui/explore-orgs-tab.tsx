import { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { InfiniteList } from '@/components/infinite-list'
import { OrgCard } from '@/components/ui/org-card'
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
        <OrgCard org={item} onPress={() => router.push(`/orgs/${item.id}`)} />
      )}
    />
  )
}
