import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/context/auth'
import { Avatar } from '@/components/ui/avatar'
import { TabBar } from '@/components/ui/tab-bar'
import { CollectionPinsTab } from '@/components/ui/collection-pins-tab'
import { CollectionTradesTab } from '@/components/ui/collection-trades-tab'
import { CollectionFollowingTab } from '@/components/ui/collection-following-tab'
import { LazyMountWrapper } from '@/components/lazy-mount-wrapper'

type Tab = 'pins' | 'trades' | 'following'

const TABS: { key: Tab; label: string }[] = [
  { key: 'pins', label: 'My Pins' },
  { key: 'trades', label: 'My Trades' },
  { key: 'following', label: 'Following' },
]

export default function PersonalScreen() {
  const { session, profile } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pins')

  const username = session?.user.email?.split('@')[0] ?? '?'

  return (
    <View className="flex-1 bg-off-white">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-monda-bold text-[28px] text-deep-black">Personal</Text>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Avatar url={profile?.avatar_url} username={profile?.username ?? username} size={40} />
          </TouchableOpacity>
        </View>

        {/* Tab chips */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} equalWidth />
      </View>

      <LazyMountWrapper show={tab === 'pins'}>
        <CollectionPinsTab />
      </LazyMountWrapper>
      <LazyMountWrapper show={tab === 'trades'}>
        <CollectionTradesTab />
      </LazyMountWrapper>
      <LazyMountWrapper show={tab === 'following'}>
        <CollectionFollowingTab />
      </LazyMountWrapper>
    </View>
  )
}
