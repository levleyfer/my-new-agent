// Warm, dark nightlife palette — gold accents on a near-black, candlelit background.
// Keep this as the single source of truth for color/spacing/type so every
// screen stays visually consistent.

export const colors = {
  background: '#17120e',
  backgroundAlt: '#221a13',
  surface: '#221a13',
  surfaceRaised: '#2c2113',
  border: '#3a2d20',

  primary: '#d6a566',
  primaryMuted: '#5a4527',
  // Text color to use ON TOP of a solid gold/primary background (buttons, etc).
  onPrimary: '#2a1d0e',
  accent: '#a8455c',
  accentMuted: '#5c2c39',

  textPrimary: '#f3ead9',
  textSecondary: '#a8967c',
  textMuted: '#80715c',

  danger: '#e2705a',
  success: '#7fbf5f',

  // Gold-styled chip — used for tags shared with the current user.
  chipSharedBg: '#2c2113',
  chipSharedBorder: '#5a4527',
  chipSharedText: '#e7c690',
  // Muted chip — used for tags not shared with the current user.
  chipMutedBg: '#1f1810',
  chipMutedBorder: '#36291d',
  chipMutedText: '#9a8870',

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

export const typography = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.textPrimary },
  subtitle: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  label: { fontSize: 15, fontWeight: '600' as const, color: colors.textPrimary },
};
