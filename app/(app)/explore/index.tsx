import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { Search, Plus } from 'lucide-react-native'
import { ExplorePinsTab } from '@/components/ui/explore-pins-tab'
import { ExploreOrgsTab } from '@/components/ui/explore-orgs-tab'
import { ExploreUsersTab } from '@/components/ui/explore-users-tab'
import { TabBar } from '@/components/ui/tab-bar'
import { Colors } from '@/constants/theme'
import type { ExploreTab } from '@/types'
import { LazyMountWrapper } from '@/components/lazy-mount-wrapper'

const TABS: { key: ExploreTab; label: string }[] = [
  { key: 'pins', label: 'Pins' },
  { key: 'orgs', label: 'Organizations' },
  { key: 'users', label: 'Users' },
]

export default function ExploreScreen() {
  const router = useRouter()
  const [tab, setTab] = useState<ExploreTab>('pins')
  const [query, setQuery] = useState('')

  const placeholder =
    tab === 'pins' ? 'Search pins...' : tab === 'orgs' ? 'Search organizations...' : 'Search users...'

  return (
    <View className="flex-1 bg-off-white">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row justify-between items-center mb-[14px]">
          <Text className="font-monda-bold text-[28px] text-deep-black">Explore</Text>
          {tab === 'pins' && (
            <TouchableOpacity
              onPress={() => router.push('/pins/new')}
              className="flex-row items-center gap-1.5 bg-deep-black px-3.5 py-2 rounded-btn"
            >
              <Plus size={15} color="white" strokeWidth={2.5} />
              <Text className="font-monda-bold text-[13px] text-white">New pin</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar */}
        <View className="flex-row items-center bg-gray-100 rounded-btn px-3 mb-3 gap-2">
          <Search size={16} color={Colors.dark.muted} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            placeholderTextColor={Colors.dark.muted}
            className="flex-1 font-monda text-sm text-deep-black py-[10px]"
          />
        </View>

        {/* Tab chips */}
        <TabBar tabs={TABS} active={tab} onChange={(key) => { setTab(key); setQuery('') }} />
      </View>


      <LazyMountWrapper show={tab === 'pins'}>
        <ExplorePinsTab query={query} />
      </LazyMountWrapper>
      <LazyMountWrapper show={tab === 'orgs'}>
        <ExploreOrgsTab query={query} />
      </LazyMountWrapper>
      <LazyMountWrapper show={tab === 'users'}>
        <ExploreUsersTab query={query} />
      </LazyMountWrapper>
    </View>
  )
}
