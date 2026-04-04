# Pindex — Project Context

## What we're building

Pindex is a mobile app for collecting and trading physical pins, aimed primarily at students in organizations (student associations) in Trondheim, Norway.

Organizations create and distribute physical pins. Users collect them, track their collections digitally, and record trades that have already happened in real life. Pindex is a log and social layer on top of real-world pin trading — it does not coordinate or facilitate trades, it records them after the fact.

## Core user flows

### Collecting
1. User signs up and gets a profile
2. User browses/searches pins and adds them to their collection
3. On any pin, the user can independently toggle: in collection, wishlisted, and want to trade (these are not mutually exclusive)

### Recording a trade
1. User traded pins with someone IRL and wants to log it
2. User opens the trade recording flow and fills in:
   - Pins they gave away (searched from their collection, the full pin DB, or created inline)
   - Pins they received (same sources — no restriction on which side uses which source)
   - Who they traded with (a Pindex user, an existing contact, or a new name)
3. The trade is saved immediately — it exists regardless of whether the other party confirms it
4. If the other party is a Pindex user, they are notified and can confirm the trade
5. If both users independently record the same trade, the UX should surface this and help them link/merge — duplicate trades are technically possible but should be rare in practice

### Social
- Users can follow each other
- Each user has a trading history listing everyone they've traded with (both Pindex users and non-Pindex contacts)

## Non-Pindex contacts

Each user has a private catalog of contacts — people they've traded with who are not on Pindex. A contact entry exists because of at least one recorded trade.

When a new user signs up, a name-match check runs against all existing users' contact catalogs. If a match is found, the existing user is notified and asked to confirm whether the new account is the same person. If confirmed, the relevant trades are surfaced to the new user for confirmation.

## Domain concepts

- **Profile** — app user, linked to `auth.users`. Has a role: `user`, `org_admin`, or `superadmin`
- **Organization** — a club or association that issues pins (e.g. a student organization). Has one admin user
- **Pin** — a collectible physical pin, issued by an organization
- **UserPin** — represents a user's relationship to a pin. Has three independent boolean flags: `in_collection`, `wishlisted`, `want_to_trade` (all can be true at the same time)
- **Trade** — a recorded real-life exchange between two parties. Created by one user; the other party (if on Pindex) can confirm it. Status: `unconfirmed` → `confirmed`
- **TradeItem** — a single pin within a trade, tagged as `gave` or `received` from the creating user's perspective
- **Contact** — a non-Pindex person in a user's private catalog, linked to at least one trade. If they later join Pindex, trades can be confirmed and the contact linked to their new profile
- **Follow** — social follow between users

## UI notes

- There is one general pin browsing page for discovery
- The trade recording flow has its own dedicated page/modal with a pin search that surfaces three result groups: pins in the user's collection, all other pins in the DB, and a "create new pin" option

## Tech stack

- **Expo (React Native)** with TypeScript
- **NativeWind** for styling (Tailwind CSS syntax)
- **Supabase** for auth, database, and storage
- Generated DB types live in `types/supabase.ts` — regenerate with `npx supabase gen types typescript --linked > types/supabase.ts`
- Supabase client singleton is at `lib/supabase.ts`
- Friendly type aliases are in `types/index.ts`
