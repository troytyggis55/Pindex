# Pindex — Project Context

## What we're building

Pindex is a mobile app for collecting and trading physical pins, aimed primarily at students in organizations (student associations) in Trondheim, Norway.

Organizations create and distribute physical pins. Users collect them, track their collections digitally, and trade with other users. A trade in the app represents a real-life physical exchange — users agree on a trade digitally, then swap pins in person.

## Core user flow

1. User signs up and gets a profile
2. User finds pins (by browsing or searching) and adds them to their collection
3. User marks pins as available for trading or on their wishlist
4. User initiates a trade with another user — specifying which pins are offered and which are requested
5. The other user accepts/rejects the trade
6. Trade is completed after the physical exchange happens

## Domain concepts

- **Profile** — app user, linked to `auth.users`. Has a role: `user`, `org_admin`, or `superadmin`
- **Organization** — a club or association that issues pins (e.g. a student organization). Has one admin user
- **Pin** — a collectible physical pin, issued by an organization
- **UserPin** — a pin in a user's collection, with a status: `collection`, `trading`, or `wishlist`
- **Trade** — a proposed exchange between two users with a status lifecycle: `pending` → `accepted` → `completed` (or `cancelled`)
- **TradeItem** — a single pin within a trade, either `offered` or `requested`, belonging to one of the two traders
- **Follow** — social follow between users

## Tech stack

- **Expo (React Native)** with TypeScript
- **NativeWind** for styling (Tailwind CSS syntax)
- **Supabase** for auth, database, and storage
- Generated DB types live in `types/supabase.ts` — regenerate with `npx supabase gen types typescript --linked > types/supabase.ts`
- Supabase client singleton is at `lib/supabase.ts`
- Friendly type aliases are in `types/index.ts`
