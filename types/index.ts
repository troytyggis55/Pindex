import type { Database } from './supabase'

type Tables = Database['public']['Tables']

// ── Raw DB row types ──────────────────────────────────────────────────────────
export type User = Tables['profiles']['Row']
export type Organization = Tables['organizations']['Row']
export type Pin = Tables['pins']['Row']
export type UserPin = Tables['user_pins']['Row']
export type Trade = Tables['trades']['Row']
export type TradeItem = Tables['trade_items']['Row']
export type Contact = Tables['contacts']['Row']
export type Follow = Tables['follows']['Row']

// ── Slim join shapes (subset of a row, used in nested selects) ────────────────

/** Slim profile returned by nested selects — id + username + avatar only */
export type ProfileSnap = { id: string; username: string; avatar_url: string | null }

/** Slim org returned by nested selects — name + logo only */
export type OrgSnap = { name: string; logo_url: string | null }

// ── Common joined types ───────────────────────────────────────────────────────

/** Pin with its full Organization row (or null if unaffiliated) */
export type PinWithOrg = Pin & { organization: Organization | null }

/** The subset of UserPin flags used on the pin detail screen */
export type UserPinFlags = Pick<UserPin, 'id' | 'in_collection' | 'wishlisted' | 'want_to_trade'>

/** UserPin row joined with its pin (and the pin's org) */
export type CollectionItem = UserPin & { pin: Pin & { organization: Organization | null } }

/** A user who has want_to_trade=true on a given pin */
export type WantToTrader = { user_id: string; profile: { username: string } }

/** Pin shape used when selecting pins for a new trade */
export type TradePinOption = {
  id: string
  name: string
  image_url: string | null
  organization_id: string | null
  organization: { id: string; name: string; color: string | null } | null
}

/** Trade with all relations needed to render a trade card */
export type TradeWithDetails = Trade & {
  initiator: ProfileSnap
  receiver_profile: ProfileSnap | null
  receiver_contact: Pick<Contact, 'id' | 'name'> | null
  trade_items: Array<TradeItem & { pin: Pick<Pin, 'id' | 'name'> }>
}

/** Follow row with the followed user's profile */
export type FollowingUser = { following_id: string; profile: ProfileSnap }
