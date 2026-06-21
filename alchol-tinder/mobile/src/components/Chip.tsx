import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/theme';

interface Props {
  label: string;
  /** Shared (gold) chips are tags the current user has in common with this person. */
  variant?: 'shared' | 'muted';
}

/** A single rounded tag chip — shared tags render gold, other tags render muted. */
export default function Chip({ label, variant = 'muted' }: Props) {
  const isShared = variant === 'shared';
  return (
    <View style={[styles.base, isShared ? styles.shared : styles.muted]}>
      <Text style={[styles.text, isShared ? styles.sharedText : styles.mutedText]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
  },
  shared: {
    backgroundColor: colors.chipSharedBg,
    borderColor: colors.chipSharedBorder,
  },
  muted: {
    backgroundColor: colors.chipMutedBg,
    borderColor: colors.chipMutedBorder,
  },
  text: { fontSize: 12.5, fontWeight: '600' },
  sharedText: { color: colors.chipSharedText },
  mutedText: { color: colors.chipMutedText },
});
