import { StyleSheet, Switch, Text, View } from 'react-native';

import { colors, spacing } from '../theme/theme';

interface Props {
  isAvailable: boolean;
  onToggle: (value: boolean) => void;
  label?: string;
}

/**
 * Groups the green availability dot, label, and switch into a single visual
 * unit so it reads as one control in the header (rather than the dot/label/
 * switch floating independently at the edge of the screen).
 */
export default function AvailabilityToggle({ isAvailable, onToggle, label = 'Available' }: Props) {
  return (
    <View style={styles.group}>
      <View style={[styles.dot, { backgroundColor: isAvailable ? colors.success : colors.textMuted }]} />
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={isAvailable}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceRaised, true: colors.primaryMuted }}
        thumbColor={isAvailable ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
});
