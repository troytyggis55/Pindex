import { createContext, useContext, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

type AuthContextType = {
  session: Session | null
  profile: User | null
  loading: boolean        // true until auth state is known
  profileLoading: boolean // true while profile is being fetched
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  profileLoading: false,
  signOut: async () => {},
  refreshProfile: async () => {},
})

async function fetchProfile(userId: string): Promise<User | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth] event:', event, 'user:', session?.user?.id ?? null)

      setSession(session)
      setLoading(false) // auth state is known — unblock navigation immediately

      if (session?.user) {
        setProfileLoading(true)
        fetchProfile(session.user.id)
          .then(p => {
            console.log('[auth] profile loaded:', p?.username ?? null)
            setProfile(p)
          })
          .catch(err => console.warn('[auth] fetchProfile error:', err))
          .finally(() => setProfileLoading(false))
      } else {
        setProfile(null)
        setProfileLoading(false)
      }
    })

    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') supabase.auth.startAutoRefresh()
      else supabase.auth.stopAutoRefresh()
    })

    return () => {
      subscription.unsubscribe()
      appStateSub.remove()
    }
  }, [])

  const signOut = () => supabase.auth.signOut().then(() => {})

  const refreshProfile = async () => {
    if (session?.user) setProfile(await fetchProfile(session.user.id))
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, profileLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
