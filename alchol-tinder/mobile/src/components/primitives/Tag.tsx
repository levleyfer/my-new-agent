import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../../theme/tokens';
import Text from './Text';

export interface TagProps {
  label: string;
  /** 'shared' = tags shared with the current user (gold). 'muted' = other tags. */
  variant?: 'shared' | 'muted';
}

/**
 * Read-only tag pill — uniform sizing/weight regardless of variant so the
 * tag row reads as one consistent grid; only color communicates shared vs.
 * other. (For a tappable selectable chip, see `Chip`.)
 */
export default function Tag({ label, variant = 'muted' }: TagProps) {
  const isShared = variant === 'shared';
  return (
    <View style={[styles.base, isShared ? styles.shared : styles.muted]}>
      <Text variant="tag" color={isShared ? colors.chipShared.text : colors.chipMuted.text} numberOfLines={1}>
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
    backgroundColor: colors.chipShared.bg,
    borderColor: colors.chipShared.border,
  },
  muted: {
    backgroundColor: colors.chipMuted.bg,
    borderColor: colors.chipMuted.border,
  },
});
