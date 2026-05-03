# Pindex — Design Specification

## Visual Identity

### Typography
- **Font**: Monda (Google Fonts)
  - Headings: Monda Bold
  - Body / labels: Monda Regular
- **Scale**: Standard mobile scale — heading ~22–28px, section title ~18px, body ~14–15px, label/chip ~12–13px

### Color Palette

| Name        | Hex       | Usage                                                        |
|-------------|-----------|--------------------------------------------------------------|
| Red         | `#CD0808` | Destructive actions, primary CTA (e.g. log trade button)     |
| Blue        | `#06A5DF` | Wishlist flag; informational UI elements                     |
| Green       | `#1EC209` | In-collection flag                                           |
| Yellow      | `#E6CA0F` | Want-to-trade flag                                           |
| Purple      | `#6004BC` | Premium / rare pin indicator; org-verified badge             |
| Off-white   | `#FFFFFA` | Light mode background                                        |
| Deep black  | `#000E19` | Dark mode background                                         |

**Organization color**: Each organization has a primary color stored in the DB. This drives pin card backgrounds. Fallback: a neutral mid-gray (`#6B7280`) for orgs without a set color.

### Light / Dark Mode
- **Dark mode**: `#000E19` background, colored card surfaces, white text
- **Light mode**: `#FFFFFA` background, same colored cards, dark text (`#000E19`)
- System default follows device preference; user can override in Settings

---

## Design Language

### Pokédex-Inspired Card Style
App home screen style layout with circle solid color backgorund for each pin and name below. 
The pin image is displayed in a circular container that overlaps the top edge of the card, creating a badge-like effect. The card background color is derived from the pin's associated organization's color, providing immediate visual grouping by org. 
The card itself has a soft drop shadow to create depth and make it feel tactile and is reused around the entire app.


### Confirmed vs. Unconfirmed Pins
Pins that were created by a user without an associated verified organization (i.e. no org or unverified org) are visually distinct:
- Card background is **transparent or very low opacity** (the org color washes out significantly, ~20% opacity)
- A subtle dashed border replaces the solid card border
- A small "unverified" label or icon appears on the card
- Confirmed (org-backed) pins have full solid card backgrounds

### Pin Images — Progression Levels
The pin image treatment evolves as the asset quality improves:
1. **Level 1 (current)**: Uploaded photo — displayed in a circle with `border-radius: 50%`, soft drop shadow, object-fit cover
2. **Level 2 (future)**: AI-processed SVG — same circular container, transparent background, can float and overflow card edges cleanly
3. **Level 3 (future goal)**: 3D metallic pin model with shine — rendered in the same circular zone with lighting/reflection treatment

The card layout should be designed to accommodate Level 2/3 overflow (pin image bleeds ~20–25% above the top-right of the card), but Level 1 photos are clipped to the circle.

### Spacing & Shape
- Card border radius: **20px**
- Button and chip border radius: **14px**
- Standard card padding: **12–16px**
- Grid gap: **12px**

### Decorative Elements
- These are low-opacity, same color as the card surface or slightly lighter — purely decorative, never interfere with content

### Icons
All icons use **Lucide** (`lucide-react-native`). Do not use other icon sets. Pick the closest semantic Lucide icon — prefer outlined style where options exist.

### Navigation Bar
- Floating bottom nav pill (dark background, icon-only)
- 3 tabs: **Explore** (left) | **New Trade** (center, elevated circular button) | **Personal** (right)
- The New Trade center button is a prominent circular icon (not a tab label) — currently black, could be styled as `#CD0808` for emphasis

---

## Screens

### 1. Explore Tab
Full-screen pin browser. Two-column grid of pin cards in Pokédex style.

**Header**: Bold "Explore" title + search bar below it  
**Filter chips**: Row of scrollable filter chips (by org, eventually by category)  
**Grid**: 2-column, pin cards as described above  
**Empty state**: Illustrated empty state with prompt to check back later

Pin cards here show no classification flags (this is a public browse view — flags are personal).

---

### 2. Pin Detail View
Opens from any pin card (Explore or Personal).

**Header**: Full-bleed colored panel using the org's color. Pin image centered and large, floating slightly above the bottom sheet. Org name + small logo top-left. Back button top-left.

**Bottom sheet** (slides up, dark in dark mode / white in light): 
- Pin name in bold Monda (large)
- Org badge row (logo + org name + verified indicator)
- Three tabs:
  - **Info** — description/meaning, rarity, how many users have it
  - **Details** — manufacturer, year, material
  - **Trade** — users who have this pin and want to trade (matchmaking info, read-only)

**Color flags**: the Info and Details tabs,
- "Have" (Green) — toggles `in_collection`
- "Wishlist" (Blue) — toggles `wishlisted`  
- "Trade" (Yellow) — toggles `want_to_trade`

---

### 3. Personal Tab
The user's personal space. Header shows username + avatar (initial-based circle for now). Tapping the avatar navigates to the full Profile page.

Three sub-tabs: **My Pins** | **My Trades** | **Following**

#### My Pins
3-column grid of the user's pin cards (same Pokédex style as Explore, but classification flags visible). Floating `+` button bottom-right to add a pin to the collection. The add flow:
1. Search existing pins in the DB
2. If not found, option to create a new (unconfirmed) pin inline

#### My Trades
Split into two sections:
- **Awaiting your confirmation** — trades where you are the receiver and the initiator has fully recorded both sides (highlighted section, yellow border)
- **My trades** — all other trades you're part of

Trade cards show: partner name, status badge (Unconfirmed / Confirmed), and a preview of pins given/received.

#### Following
List of followed users. Each row: avatar, username, unfollow button. Tap username → their public profile.

---

### 4. Trade Recording Screen
Accessed via the center `+` nav button. Full-screen modal.

**Layout**: Screen split vertically into two halves:
- **Top half**: The other party (trading partner)
- **Bottom half**: The current user

Each half contains:
- Party identifier (name / username / contact)
- A horizontal scroll or wrap of pin chips representing their side of the trade

**Two recording modes**:

**Mode A — Full trade** (you record both sides):
- You fill in your pins (bottom) and their pins (top)
- Select the other party (Pindex user, existing contact, or new name)
- Saved as `unconfirmed`; if the other party is a Pindex user, they are notified to confirm
- Other party confirms → status becomes `confirmed`

**Mode B — Partial trade** (you record your side only):
- You fill in your pins (bottom)
- Select a Pindex user as the other party
- Send to them — they receive a notification to complete the top half (their pins)
- Once they complete it, the trade auto-confirms (no separate confirmation step needed)
- Clear UI labeling distinguishes which mode is active (e.g. a toggle or step indicator)

**CTA button**: Large red (`#CD0808`) button at the bottom — "Log trade" (Mode A) or "Send to [name]" (Mode B)

**Incoming requests**: Trades in Mode B sent to the current user appear at the top of this screen as notification cards — showing the initiator's avatar, their offered pins, and a "Complete your side" CTA.

---

### 5. Profile Page
Accessed by tapping the avatar in Personal.

- Avatar (circular, initials for now)
- Username, display name
- **Organization memberships**: List of orgs the user belongs to (current and historical). Each row: org logo, org name, membership period. Tapping an org → org page.
- Stats row: total pins, total trades, trading partners
- Edit profile button

---

### 6. Organization Page
- Org banner/header with org color
- Org logo, name, member count, pin count
- Grid of all org's pins (Pokédex style)
- Org admin badge if the viewing user is admin

---

### 7. Admin Pages
Only accessible to org admins. Reachable from the org page or the user's profile org list.

- Edit org details (name, color, logo)
- Pin management: add, edit, delete pins
- Transfer admin to another user

**Add/Edit Pin form**:
- Large circular upload zone at top ("Upload pin image") — dashed circle when empty
- Fields: name, meaning/description, manufacturer, year, material
- Submit button in Blue (`#06A5DF`)

---

## Future / Out of Scope for Now
- Bilingual (Norwegian/English) support — deferred; all UI in English
- Dark mode — deferred; build light mode only for now
- SVG auto-processing from photos — Level 2 pin image
- 3D pin model rendering — Level 3 pin image
- Duplicate trade detection UX
- Contact-to-user matching on signup
- "Want to trade" matchmaking view
- In-app notification feed
