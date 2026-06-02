import { useState } from 'react'
import { View } from 'react-native'

interface LazyMountWrapperProps {
  show: boolean
  children: React.ReactNode
}

/**
 * A wrapper component that only mounts its children when `show` is true for the first time.
 * After the first time `show` becomes true, the children remain mounted but are hidden/shown based on `show`.
 * This is useful for expensive components that we don't want to mount until necessary, but also want to keep mounted after.
 */
export function LazyMountWrapper({ show, children }: LazyMountWrapperProps) {
  const [hasBeenShown, setHasBeenShown] = useState(false)

  if (show && !hasBeenShown) setHasBeenShown(true)

  if (!hasBeenShown) return null

  return (
    <View style={{ flex: 1, display: show ? 'flex' : 'none' }}>
      {children}
    </View>
  )
}