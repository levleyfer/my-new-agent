import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';

import { colors, minTapTarget, radii, spacing } from '../../theme/tokens';
import Text from './Text';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

/**
 * New generalized Button primitive for the design system (primary/secondary/
 * ghost). This is a separate component from `components/PrimaryButton.tsx`
 * (primary/danger/ghost vocabulary) which many other screens already depend
 * on — that component is left untouched. Use this one for new/refactored
 * surfaces (Nearby screen, PersonCard).
 *
 * Press feedback (scale) lives here, on the single Pressable, rather than in
 * a wrapper the caller adds around this component — nesting a second
 * Pressable around this one would double-bind onPress and risk firing it
 * twice per tap.
 */
export default function Button({ label, onPress, variant = 'primary', icon, loading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          variant === 'primary' && styles.primary,
          variant === 'secondary' && styles.secondary,
          variant === 'ghost' && styles.ghost,
          pressed && !isDisabled && (variant === 'primary' ? styles.primaryPressed : styles.outlinePressed),
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.gold.on : colors.gold.default} />
        ) : (
          <View style={styles.content}>
            {icon}
            <Text
              variant="tag"
              color={variant === 'primary' ? colors.gold.on : colors.gold.default}
              style={styles.label}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: minTapTarget,
    borderRadius: radii.md,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  label: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  primary: { backgroundColor: colors.gold.default },
  primaryPressed: { backgroundColor: colors.gold.pressed },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold.disabled,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  outlinePressed: { backgroundColor: colors.surfacePressed },
  disabled: { opacity: 0.5 },
});
