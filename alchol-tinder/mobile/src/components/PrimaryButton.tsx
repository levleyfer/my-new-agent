import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii } from '../theme/theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
}

export default function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary' }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : colors.background} />
      ) : (
        <Text style={[styles.text, variant === 'ghost' && styles.textGhost]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  text: { color: colors.background, fontSize: 16, fontWeight: '700' },
  textGhost: { color: colors.primary },
});
