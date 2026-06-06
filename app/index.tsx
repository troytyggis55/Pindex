import { Redirect } from 'expo-router'

// Authed anchor for the root stack. The root layout only mounts this when the
// user is fully authenticated, so it just forwards into the app tabs.
export default function Index() {
  return <Redirect href="/(app)/collection" />
}
