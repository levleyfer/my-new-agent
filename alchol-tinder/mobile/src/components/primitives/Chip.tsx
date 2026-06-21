import { Pressable, StyleSheet, View } from 'react-native';

import { colors, minTapTarget, radii, spacing } from '../../theme/tokens';
import Text from './Text';

export interface ChipProps {
  label: string;
  /** Selected = filled gold; unselected = outlined muted. Distinct from Tag's shared/muted read-only styling. */
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

/**
 * Tappable, selectable chip (e.g. for filter/selection UIs). Unlike `Tag`
 * (read-only, shared-vs-other coloring), `Chip` has a clear selected/
 * unselected toggle state plus press feedback.
 */
export default function Chip({ label, selected = false, onPress, disabled = false }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && !disabled && (selected ? styles.selectedPressed : styles.unselectedPressed),
        disabled && styles.disabled,
      ]}
    >
      <Text variant="tag" color={selected ? colors.gold.on : colors.text.muted} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 32,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  selected: {
    backgroundColor: colors.gold.default,
    borderColor: colors.gold.default,
  },
  selectedPressed: {
    backgroundColor: colors.gold.pressed,
    borderColor: colors.gold.pressed,
  },
  unselected: {
    backgroundColor: 'transparent',
    borderColor: colors.border.default,
  },
  unselectedPressed: {
    backgroundColor: colors.surfacePressed,
  },
  disabled: {
    opacity: 0.5,
  },
});

export const CHIP_MIN_TAP_TARGET = minTapTarget;
