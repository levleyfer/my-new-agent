import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

import { typeScale, TypeVariant } from '../../theme/tokens';

export interface TextProps extends RNTextProps {
  /** Maps to the typography scale in theme/tokens.ts (fixed size + weight). */
  variant?: TypeVariant;
  color?: string;
}

/**
 * Design-system text primitive. Always renders with `allowFontScaling` on
 * (the RN default) so Dynamic Type / OS-level font scaling keeps working —
 * never pass `allowFontScaling={false}` when using this component.
 */
export default function Text({ variant = 'body', color, style, ...rest }: TextProps) {
  const variantStyle = typeScale[variant];
  return <RNText style={[styles.base, variantStyle, color ? { color } : null, style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    // No defaults beyond the variant — keeps every text node's size/weight/color
    // traceable to a single typeScale entry.
  },
});
