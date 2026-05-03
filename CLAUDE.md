# Pindex — Project Context

## Code principles

- **Reusability first.** Before building a new component or screen, check if one already exists. One canonical implementation beats two slightly different ones.
- **PinCard is the only way to display a pin** in any list or grid. Do not render inline or one-off pin rows.
- **All pin taps navigate to the info screen** (`/(app)/explore/{pinId}`). Never route directly to the edit screen from a pin tap. The info screen is responsible for deciding whether the edit button is visible based on the user's authority.
- **Simplicity is king.** No duplicate screens, no parallel implementations. If a screen or flow already exists, reuse it.

## Tech stack

- **Expo (React Native)** with TypeScript
- **NativeWind** for styling (Tailwind CSS syntax)
- **Supabase** for auth, database, and storage
- **Lucide** (`lucide-react-native`) for all icons — do not use other icon libraries
- Generated DB types live in `types/supabase.ts` — regenerate with `npx supabase gen types typescript --linked > types/supabase.ts`
- Supabase client singleton is at `lib/supabase.ts`
- Friendly type aliases are in `types/index.ts`

## What we're building

Pindex is a mobile app for collecting and trading physical pins, aimed primarily at students in organizations (student associations) in Trondheim, Norway.

Organizations create and distribute physical pins. Users collect them, track their collections digitally, and record trades that have already happened in real life. Pindex is a log and social layer on top of real-world pin trading — it does not coordinate or facilitate trades, it records them after the fact.

## Core user flows

### Collecting
1. User signs up and gets a profile
2. User browses/searches pins and adds them to their collection
3. On any pin, the user can independently toggle: in collection, wishlisted, and want to trade (these are not mutually exclusive)
4. If a pin doesn't exist yet, any user can create it — optionally assigning it to an existing org or marking "org not on Pindex". The creating user administers the pin until an org admin claims it (see Pin domain concept below).

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
- **Pin** — a collectible physical pin. Any authenticated user can create one. `created_by` points to the creating user (nullable for pre-migration rows). `organization_id` is the assigned or owning org (nullable). `org_claimed_at` is a timestamp: `null` while the `created_by` user administers the pin, non-null once an org admin has claimed it. After a claim, only the org admin can edit; before a claim, only `created_by` can edit.
- **UserPin** — represents a user's relationship to a pin. Has three independent boolean flags: `in_collection`, `wishlisted`, `want_to_trade` (all can be true at the same time)
- **Trade** — a recorded real-life exchange between two parties. Created by one user; the other party (if on Pindex) can confirm it. Status: `unconfirmed` → `confirmed`
- **TradeItem** — a single pin within a trade, tagged as `gave` or `received` from the creating user's perspective
- **Contact** — a non-Pindex person in a user's private catalog, linked to at least one trade. If they later join Pindex, trades can be confirmed and the contact linked to their new profile
- **Follow** — social follow between users

## Task tracking

Planned features are tracked in `TODO.md` at the repo root. Each item is a checkbox. Remove the item from `TODO.md` once it is fully implemented.

## Frontend / design

Design decisions (visual style, color palette, typography, screen layouts, component patterns) are documented in `DESIGN.md` at the repo root. Only read `DESIGN.md` when the task involves UI work — skip it for backend, data, or logic-only tasks.
