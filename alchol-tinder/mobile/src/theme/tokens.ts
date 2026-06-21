// Design tokens — the single source of truth for color, spacing, radius, and
// typography across the app. `theme.ts` re-exports a flatter, legacy-shaped
// view of these same values so every existing screen keeps compiling and
// rendering identically; new/refactored components should import from here
// directly and use the richer semantic names (surface levels, pressed/disabled
// states, etc).
//
// Palette: warm, dark nightlife — gold accents on a near-black, candlelit
// background.

export const colors = {
  // Surface levels (lowest to highest "elevation").
  surface: {
    bg: '#17120e',
    card: '#221a13',
    raised: '#1d1610',
  },

  // Borders.
  border: {
    default: '#3a2d20',
    subtle: '#322619',
  },

  // Gold accent and its interaction states.
  gold: {
    default: '#d6a566',
    pressed: '#c2935a',
    disabled: '#5a4527',
    on: '#2a1d0e', // text/icon color to use ON TOP of a solid gold background
  },

  // Text scale.
  text: {
    primary: '#f3ead9',
    muted: '#a8967c',
    faint: '#80715c',
  },

  // Status / semantic states.
  state: {
    success: '#7fbf5f',
    danger: '#e2705a',
  },

  // Surface pressed/disabled variants (for cards, chips, buttons that sit on
  // a surface rather than using the gold accent).
  surfacePressed: '#2c2113',
  surfaceDisabled: '#1a1510',

  // Gold-styled chip — used for tags shared with the current user.
  chipShared: {
    bg: '#2c2113',
    border: '#5a4527',
    text: '#e7c690',
  },
  // Muted chip — used for tags not shared with the current user.
  chipMuted: {
    bg: '#1f1810',
    border: '#36291d',
    text: '#9a8870',
  },

  overlay: 'rgba(0,0,0,0.45)',
  white: '#ffffff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

// Two weights only: 400 (regular) and 500 (medium).
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
};

// Typography scale — fixed size + weight per variant. Four sizes total.
export const typeScale = {
  title: { fontSize: 22, fontWeight: fontWeight.medium, color: colors.text.primary },
  name: { fontSize: 17, fontWeight: fontWeight.medium, color: colors.text.primary },
  body: { fontSize: 15, fontWeight: fontWeight.regular, color: colors.text.primary },
  meta: { fontSize: 13, fontWeight: fontWeight.regular, color: colors.text.muted },
  tag: { fontSize: 12.5, fontWeight: fontWeight.medium, color: colors.text.primary },
} as const;

export type TypeVariant = keyof typeof typeScale;

// Minimum tap target size (accessibility — Apple/Android both recommend 44pt).
export const minTapTarget = 44;
