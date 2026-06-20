// Warm evening/bar palette — amber & wine tones on a dark, candlelit background.
// Keep this as the single source of truth for color/spacing/type so every
// screen stays visually consistent.

export const colors = {
  background: '#1b140f',
  backgroundAlt: '#241a13',
  surface: '#2a1f16',
  surfaceRaised: '#33261b',
  border: '#473527',

  primary: '#e2a554',
  primaryMuted: '#7a5a36',
  accent: '#a8455c',
  accentMuted: '#5c2c39',

  textPrimary: '#f5ebdd',
  textSecondary: '#bda88f',
  textMuted: '#8a7763',

  danger: '#e2705a',
  success: '#8caa6e',

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
