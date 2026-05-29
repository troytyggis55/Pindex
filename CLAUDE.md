# Pindex — Project Context

---

## Code quality rules

These are non-negotiable. Apply them to every change, new or existing code.

### Types

- **`types/index.ts` is the only place for shared types.** Before defining a type, check if it belongs there. If two or more files need the same shape, it goes in `index.ts`.
- **Composed/derived DB types belong in `index.ts` too.** `Pin & { organization: Organization | null }` → define once as `PinWithOrg` in `index.ts`, import everywhere. Never redefine the same shape per file.
- **Inline types are only allowed for truly local concerns** — e.g. a string-literal union driving a local `useState` (`type DetailTab = 'info' | 'details' | 'trade'`). The moment a type is needed outside one component, move it to `index.ts`.
- **Never use anonymous inline object types for props.** Name every prop type (`TradePinCardProps`) above the component, or export it from `index.ts` if consumed elsewhere.

### Styling — NativeWind first

- **`className` is the default. `style={}` is the exception.** Write `className="flex-1 bg-off-white px-4"`, not `style={{ flex: 1, backgroundColor: '#FFFFFA', paddingHorizontal: 16 }}`.
- **`constants/theme.ts` values are for dynamic styles only** — org colors from the DB, runtime-computed values. Static design-token values (spacing, org colors, radii) must use Tailwind classes.
- **No raw hex strings in JSX.** If a color isn't a dynamic DB value, it must be a Tailwind class or a `Colors.*` token — never a literal `'#FFFFFA'` or `'rgba(255,255,255,0.3)'` in a style object.
- **Legitimate `style={}` exceptions:** `shadowColor`/`elevation` keyed off a prop, `hitSlop`, `resizeMode`, and other RN-only properties that have no Tailwind equivalent.

### Components

- **Check `components/ui/` before writing any UI.** If a back button, badge, tab bar, overlay, or list row already exists, use it. Do not create a second version.
- **Extract a component the moment a UI block is used more than once, or its JSX exceeds ~30 lines.** Move it to `components/ui/` — not to the top of a screen file.
- **Sub-components defined inside a screen file are a red flag.** If you find yourself writing `function Foo()` inside a screen, stop and create `components/ui/foo.tsx` instead.
- **Every component gets a named export and its own file** under `components/ui/`. Default exports are for screens (route files) only.
- **Screens are orchestrators, not renderers.** A screen file wires data and state; its JSX should be composed components, not raw `View`/`Text` trees.
- **PinCard is the only way to display a pin** in any list or grid. Never render inline or one-off pin rows.
- **All pin taps navigate to the info screen** (`/pins/[pinId]`). Never route directly to the edit screen from a tap.

---

## Tech stack

- **Expo (React Native)** with TypeScript
- **NativeWind** for styling (Tailwind CSS syntax)
- **Supabase** for auth, database, and storage
- **Lucide** (`lucide-react-native`) for all icons — do not use other icon libraries
- Generated DB types: `types/supabase.ts` — regenerate with `npx supabase gen types typescript --linked > types/supabase.ts`
- Supabase client singleton: `lib/supabase.ts`
- Shared type aliases: `types/index.ts`

---

## What we're building

Pindex is a mobile app for collecting and trading physical pins, for students in organizations in Trondheim, Norway. Users collect pins, track collections digitally, and log trades that happened in real life. Pindex is a record-keeping and social layer — it does not facilitate trades, it records them after the fact.

## Core user flows

- **Collecting** — browse/search pins, toggle `in_collection` / `wishlisted` / `want_to_trade` independently on any pin. Any user can create a new pin.
- **Trading** — log a real-life trade: pick pins given and received, pick a partner (Pindex user, existing contact, or new name). Trade is saved immediately; the other party can confirm if they're on Pindex.
- **Social** — follow users, view trading history.

## Domain concepts

- **Profile** — app user (`auth.users`). Role: `user`, `org_admin`, or `superadmin`.
- **Organization** — issues pins, has one admin user.
- **Pin** — created by any user. `org_claimed_at` is `null` while `created_by` administers it; non-null after an org admin claims it. Edit rights follow this: creator before claim, org admin after.
- **UserPin** — a user's relationship to a pin. Three independent flags: `in_collection`, `wishlisted`, `want_to_trade`.
- **Trade** — a logged real-life exchange. Status: `unconfirmed` → `confirmed`. Contains `TradeItem` rows tagged `gave` or `received`.
- **Contact** — a non-Pindex trading partner in a user's private catalog. Can be linked to a Profile if they later join.

---

## Task tracking

Planned features are tracked in `TODO.md`. Each item is a checkbox — remove it once fully implemented.

## Frontend / design

Design decisions are in `DESIGN.md`. Only read it for UI tasks — skip for backend or logic-only work.
