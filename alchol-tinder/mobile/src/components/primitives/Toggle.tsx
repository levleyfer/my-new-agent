import { StyleSheet, Switch, View } from 'react-native';

import { colors, spacing } from '../../theme/tokens';
import Text from './Text';

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  /** Shows a status dot before the label (e.g. green when on) — used for "Available". */
  showStatusDot?: boolean;
  disabled?: boolean;
}

/** Labeled switch with an optional status dot, grouped into one pill-shaped control. */
export default function Toggle({ value, onValueChange, label, showStatusDot = false, disabled = false }: ToggleProps) {
  return (
    <View style={styles.group}>
      {showStatusDot && (
        <View style={[styles.dot, { backgroundColor: value ? colors.state.success : colors.text.faint }]} />
      )}
      {label && (
        <Text variant="meta" color={colors.text.muted}>
          {label}
        </Text>
      )}
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.surface.raised, true: colors.gold.disabled }}
        thumbColor={value ? colors.gold.default : colors.text.faint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
