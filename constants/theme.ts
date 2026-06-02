// Pindex design tokens — mirrors tailwind.config.js
// Use Tailwind classes where possible; use these constants only for
// dynamic/computed styles (e.g. org colors from DB, interpolated values).

export const Colors = {
  red:      '#CD0808',
  blue:     '#06A5DF',
  green:    '#1EC209',
  yellow:   '#E6CA0F',
  purple:   '#6004BC',
  offWhite: '#FFFFFA',
  deepBlack:'#000E19',

  // Semantic aliases
  flagHave:      '#1EC209', // in_collection
  flagWishlist:  '#06A5DF', // wishlisted
  flagTrade:     '#E6CA0F', // want_to_trade

  orgFallback: '#6B7280', // gray-500 — used when org has no color set

  dark: {
    background: '#000E19',
    surface:    '#0D1E2E',
    text:       '#FFFFFA',
    muted:      '#6B7280',
  },
  light: {
    background: '#FFFFFA',
    surface:    '#FFFFFF',
    text:       '#000E19',
    muted:      '#6B7280',
  },
} as const

export const Radius = {
  card: 20,
  btn:  14,
  chip: 8,
} as const

export const Spacing = {
  cardPad:  12,
  gridGap:  12,
  screenPad: 16,
  navOffset: 84, // floating bottom nav height + padding; bottom inset for scroll content
} as const

// Flag metadata — single source of truth for label + color per UserPin flag
export const FLAGS = [
  { key: 'in_collection' as const, label: 'Have',     color: Colors.flagHave },
  { key: 'wishlisted'   as const, label: 'Wishlist',  color: Colors.flagWishlist },
  { key: 'want_to_trade'as const, label: 'Trade',     color: Colors.flagTrade },
] as const

export type FlagKey = typeof FLAGS[number]['key']
