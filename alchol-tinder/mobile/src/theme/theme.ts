// Legacy flat theme shape — kept so every existing screen/component that
// imports { colors, spacing, radii, typography } from here keeps compiling
// and rendering identically. `theme/tokens.ts` is now the real single source
// of truth (richer semantic structure: surface levels, pressed/disabled
// states, etc); this file just re-shapes those tokens into the original flat
// API. New/refactored components (Nearby screen + primitives) should import
// from `theme/tokens` directly instead of adding to this file.

import { colors as tokenColors, radii, spacing, typeScale } from './tokens';

export const colors = {
  background: tokenColors.surface.bg,
  backgroundAlt: tokenColors.surface.card,
  surface: tokenColors.surface.card,
  surfaceRaised: tokenColors.surfacePressed,
  border: tokenColors.border.default,

  primary: tokenColors.gold.default,
  primaryMuted: tokenColors.gold.disabled,
  // Text color to use ON TOP of a solid gold/primary background (buttons, etc).
  onPrimary: tokenColors.gold.on,
  accent: '#a8455c',
  accentMuted: '#5c2c39',

  textPrimary: tokenColors.text.primary,
  textSecondary: tokenColors.text.muted,
  textMuted: tokenColors.text.faint,

  danger: tokenColors.state.danger,
  success: tokenColors.state.success,

  // Gold-styled chip — used for tags shared with the current user.
  chipSharedBg: tokenColors.chipShared.bg,
  chipSharedBorder: tokenColors.chipShared.border,
  chipSharedText: tokenColors.chipShared.text,
  // Muted chip — used for tags not shared with the current user.
  chipMutedBg: tokenColors.chipMuted.bg,
  chipMutedBorder: tokenColors.chipMuted.border,
  chipMutedText: tokenColors.chipMuted.text,

  overlay: tokenColors.overlay,
  white: tokenColors.white,
} as const;

export { spacing, radii };

export const typography = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.textPrimary },
  subtitle: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  body: { fontSize: typeScale.body.fontSize, fontWeight: '400' as const, color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  label: { fontSize: 15, fontWeight: '600' as const, color: colors.textPrimary },
};
